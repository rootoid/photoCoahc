/* ═══════════════════════════════════════════════════════════
   PhotoCoach — Exposure Simulation Engine
   ═══════════════════════════════════════════════════════════

   Handles the core photography simulation logic:
   - Exposure Value (EV) calculations
   - Image filter simulation
   - Grading & feedback generation
*/

const ExposureEngine = (() => {

    /**
     * Calculate the Exposure Value from camera settings indices.
     * EV = log2(N^2 / t) where N = aperture f-number, t = shutter time in seconds.
     * We then adjust for ISO (ISO 100 is the base).
     *
     * Higher EV = less light reaching sensor (brighter scene needed)
     * Lower EV = more light reaching sensor
     */
    function calcEV(isoIdx, apertureIdx, shutterIdx) {
        const iso = ISO_STOPS[isoIdx];
        const aperture = APERTURE_STOPS[apertureIdx];
        const shutterTime = SHUTTER_STOPS[shutterIdx];

        // EV at ISO 100
        const ev100 = Math.log2((aperture * aperture) / shutterTime);
        // Adjust for ISO: each doubling of ISO = 1 stop more light
        const isoAdjustment = Math.log2(iso / 100);
        // The effective EV (higher = darker scene can be properly exposed)
        return ev100 - isoAdjustment;
    }

    /**
     * Calculate the exposure difference between user settings and ideal settings.
     * Positive = overexposed, Negative = underexposed
     */
    function getExposureDiff(userSettings, idealSettings) {
        const userEV = calcEV(userSettings.iso, userSettings.aperture, userSettings.shutter);
        const idealEV = calcEV(idealSettings.iso, idealSettings.aperture, idealSettings.shutter);
        return idealEV - userEV; // positive means user let in more light (overexposed)
    }

    /**
     * Generate CSS filter string to simulate the photo result.
     */
    function getImageFilters(userSettings, idealSettings, scene) {
        const evDiff = getExposureDiff(userSettings, idealSettings);

        // Brightness: map EV difference to brightness multiplier
        // Each stop = 2x light, but visually we use a softer curve
        let brightness = Math.pow(2, evDiff * 0.45);
        brightness = Math.max(0.05, Math.min(4, brightness));

        // Contrast: overexposure washes out, underexposure crushes
        let contrast = 1;
        if (evDiff > 1.5) {
            contrast = Math.max(0.5, 1 - (evDiff - 1.5) * 0.15);
        } else if (evDiff < -1.5) {
            contrast = Math.min(1.4, 1 + Math.abs(evDiff + 1.5) * 0.12);
        }

        // Saturation: overexposure desaturates, underexposure slightly desaturates too
        let saturation = 1;
        if (Math.abs(evDiff) > 1) {
            saturation = Math.max(0.2, 1 - (Math.abs(evDiff) - 1) * 0.2);
        }

        // Motion blur simulation (if scene has motion and shutter is too slow)
        let blur = 0;
        if (scene.hasMotion) {
            const shutterTime = SHUTTER_STOPS[userSettings.shutter];
            // For action, anything slower than ~1/125 starts getting blurry
            if (shutterTime > 1/125) {
                blur = Math.min(8, shutterTime * 4);
            }
        }

        // White balance shift
        const userWB = WB_STOPS[userSettings.wb];
        const idealWB = WB_STOPS[idealSettings.wb];
        const wbDiff = userWB - idealWB; // positive = warmer, negative = cooler

        // Map WB difference to hue-rotate
        // Warmer → slight orange/yellow shift, Cooler → slight blue shift
        let hueRotate = 0;
        let wbSepia = 0;
        if (wbDiff > 1000) {
            wbSepia = Math.min(0.3, (wbDiff - 1000) / 10000);
        } else if (wbDiff < -1000) {
            hueRotate = Math.max(-30, wbDiff / 200);
        }

        let filterStr = `brightness(${brightness.toFixed(3)}) contrast(${contrast.toFixed(3)}) saturate(${saturation.toFixed(3)})`;
        if (blur > 0) {
            filterStr += ` blur(${blur.toFixed(1)}px)`;
        }
        if (wbSepia > 0) {
            filterStr += ` sepia(${wbSepia.toFixed(3)})`;
        }
        if (hueRotate !== 0) {
            filterStr += ` hue-rotate(${hueRotate.toFixed(1)}deg)`;
        }

        return filterStr;
    }

    /**
     * Calculate noise level based on ISO.
     * Returns opacity 0-1 for noise overlay.
     */
    function getNoiseLevel(isoIdx) {
        // ISO 100 = no noise, ISO 12800 = heavy noise
        const noiseMap = [0, 0.02, 0.06, 0.12, 0.2, 0.32, 0.45, 0.6];
        return noiseMap[isoIdx] || 0;
    }

    /**
     * Generate noise on a canvas.
     */
    function renderNoise(canvas, intensity) {
        const ctx = canvas.getContext('2d');
        const w = canvas.width = canvas.offsetWidth;
        const h = canvas.height = canvas.offsetHeight;

        if (intensity <= 0) {
            canvas.style.opacity = 0;
            return;
        }

        const imageData = ctx.createImageData(w, h);
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
            const noise = (Math.random() - 0.5) * 255;
            data[i] = 128 + noise;     // R
            data[i+1] = 128 + noise;   // G
            data[i+2] = 128 + noise;   // B
            data[i+3] = 255;           // A
        }
        ctx.putImageData(imageData, 0, 0);
        canvas.style.opacity = intensity;
    }

    /**
     * Grade the shot and return score + feedback.
     */
    function gradeShot(userSettings, scene) {
        const ideal = scene.idealSettings;
        const range = scene.acceptableRange;
        const feedback = [];
        let totalScore = 0;

        // ── 1. Exposure (40 points max) ────────────────────────
        const evDiff = getExposureDiff(userSettings, ideal);
        const absEV = Math.abs(evDiff);

        let exposureScore;
        if (absEV <= 0.5) {
            exposureScore = 40;
            feedback.push({ type: 'success', icon: '✅', text: 'Perfect exposure! The image is beautifully lit.' });
        } else if (absEV <= 1) {
            exposureScore = 32;
            if (evDiff > 0) {
                feedback.push({ type: 'warning', icon: '☀️', text: `Slightly overexposed (+${evDiff.toFixed(1)} EV). The highlights are a bit blown — reduce exposure by about ${absEV.toFixed(1)} stop${absEV > 1 ? 's' : ''}.` });
            } else {
                feedback.push({ type: 'warning', icon: '🌙', text: `Slightly underexposed (${evDiff.toFixed(1)} EV). The shadows are a bit dark — increase exposure by about ${absEV.toFixed(1)} stop${absEV > 1 ? 's' : ''}.` });
            }
        } else if (absEV <= 2) {
            exposureScore = 20;
            if (evDiff > 0) {
                feedback.push({ type: 'error', icon: '🔆', text: `Overexposed by ${evDiff.toFixed(1)} stops! The image looks washed out. Lower your ISO, use a smaller aperture, or faster shutter speed.` });
            } else {
                feedback.push({ type: 'error', icon: '🌑', text: `Underexposed by ${Math.abs(evDiff).toFixed(1)} stops! The image is too dark. Raise your ISO, open your aperture, or slow your shutter.` });
            }
        } else {
            exposureScore = Math.max(0, 10 - (absEV - 2) * 5);
            if (evDiff > 0) {
                feedback.push({ type: 'error', icon: '💥', text: `Severely overexposed (${evDiff.toFixed(1)} stops)! The image is completely blown out. You need to drastically reduce the light reaching the sensor.` });
            } else {
                feedback.push({ type: 'error', icon: '⬛', text: `Severely underexposed (${Math.abs(evDiff).toFixed(1)} stops)! The image is nearly black. You need significantly more light.` });
            }
        }
        totalScore += exposureScore;

        // ── 2. ISO appropriateness (15 points max) ─────────────
        const isoDiff = Math.abs(userSettings.iso - ideal.iso);
        let isoScore;
        if (isoDiff <= range.iso) {
            isoScore = 15;
            if (ISO_STOPS[userSettings.iso] <= 400) {
                feedback.push({ type: 'success', icon: '🎯', text: 'Great ISO choice — low noise for a clean image.' });
            }
        } else if (isoDiff <= range.iso + 1) {
            isoScore = 10;
            if (userSettings.iso > ideal.iso) {
                feedback.push({ type: 'warning', icon: '📊', text: `ISO ${ISO_STOPS[userSettings.iso]} is a bit high. You'll see some noise. Try ISO ${ISO_STOPS[ideal.iso]} for a cleaner result.` });
            } else {
                feedback.push({ type: 'info', icon: '💡', text: `ISO ${ISO_STOPS[userSettings.iso]} is lower than needed. You might need to compensate with aperture or shutter speed.` });
            }
        } else {
            isoScore = Math.max(0, 5 - (isoDiff - range.iso - 1) * 2);
            if (userSettings.iso > ideal.iso + 2) {
                feedback.push({ type: 'error', icon: '🔴', text: `ISO ${ISO_STOPS[userSettings.iso]} is way too high for this scene! The image will be very grainy. Recommended: ISO ${ISO_STOPS[ideal.iso]}.` });
            }
        }
        totalScore += isoScore;

        // ── 3. Aperture appropriateness (20 points max) ────────
        const apDiff = Math.abs(userSettings.aperture - ideal.aperture);
        let apertureScore;
        if (apDiff <= range.aperture) {
            apertureScore = 20;
            if (scene.needsSharpBackground) {
                feedback.push({ type: 'success', icon: '🏔️', text: `f/${APERTURE_STOPS[userSettings.aperture]} gives you great depth of field for this scene.` });
            } else if (APERTURE_STOPS[userSettings.aperture] <= 2.8) {
                feedback.push({ type: 'success', icon: '✨', text: `f/${APERTURE_STOPS[userSettings.aperture]} creates beautiful background blur — perfect for isolating your subject.` });
            }
        } else if (apDiff <= range.aperture + 1) {
            apertureScore = 13;
            if (scene.needsSharpBackground && userSettings.aperture < ideal.aperture) {
                feedback.push({ type: 'warning', icon: '🔍', text: `f/${APERTURE_STOPS[userSettings.aperture]} gives too shallow depth of field. For ${scene.category.toLowerCase()} photography, try f/${APERTURE_STOPS[ideal.aperture]} for edge-to-edge sharpness.` });
            } else if (!scene.needsSharpBackground && userSettings.aperture > ideal.aperture) {
                feedback.push({ type: 'warning', icon: '🔍', text: `f/${APERTURE_STOPS[userSettings.aperture]} gives too much depth of field. For this ${scene.category.toLowerCase()} scene, try f/${APERTURE_STOPS[ideal.aperture]} for better subject isolation.` });
            } else {
                feedback.push({ type: 'info', icon: '📸', text: `f/${APERTURE_STOPS[userSettings.aperture]} works, but f/${APERTURE_STOPS[ideal.aperture]} would be more ideal for this scene.` });
            }
        } else {
            apertureScore = Math.max(0, 7 - (apDiff - range.aperture - 1) * 3);
            feedback.push({ type: 'error', icon: '⚠️', text: `f/${APERTURE_STOPS[userSettings.aperture]} is not suitable for this scene. Use f/${APERTURE_STOPS[ideal.aperture]} instead.` });
        }
        totalScore += apertureScore;

        // ── 4. Shutter speed appropriateness (20 points max) ──
        const shDiff = Math.abs(userSettings.shutter - ideal.shutter);
        let shutterScore;
        if (shDiff <= range.shutter) {
            shutterScore = 20;
            if (scene.hasMotion) {
                feedback.push({ type: 'success', icon: '⚡', text: `${SHUTTER_LABELS[userSettings.shutter]} freezes the action perfectly!` });
            }
        } else if (shDiff <= range.shutter + 1) {
            shutterScore = 12;
            if (scene.hasMotion && userSettings.shutter < ideal.shutter) {
                feedback.push({ type: 'warning', icon: '💨', text: `${SHUTTER_LABELS[userSettings.shutter]} is too slow — you'll get motion blur. Try ${SHUTTER_LABELS[ideal.shutter]} to freeze the action.` });
            } else if (scene.id === 'waterfall_silky' && userSettings.shutter > ideal.shutter) {
                feedback.push({ type: 'warning', icon: '💧', text: `${SHUTTER_LABELS[userSettings.shutter]} is too fast for silky water. Slow down to ${SHUTTER_LABELS[ideal.shutter]} for the smooth effect.` });
            } else {
                feedback.push({ type: 'info', icon: '⏱️', text: `${SHUTTER_LABELS[userSettings.shutter]} works, but ${SHUTTER_LABELS[ideal.shutter]} would be better for this scene.` });
            }
        } else {
            shutterScore = Math.max(0, 5 - (shDiff - range.shutter - 1) * 2);
            if (scene.hasMotion && userSettings.shutter < ideal.shutter) {
                feedback.push({ type: 'error', icon: '🌀', text: `${SHUTTER_LABELS[userSettings.shutter]} is way too slow! Your subject will be a blurry mess. Use ${SHUTTER_LABELS[ideal.shutter]} or faster.` });
            } else {
                feedback.push({ type: 'error', icon: '⏱️', text: `Shutter speed ${SHUTTER_LABELS[userSettings.shutter]} is far from ideal. Try ${SHUTTER_LABELS[ideal.shutter]}.` });
            }
        }
        totalScore += shutterScore;

        // ── 5. White balance (5 points max) ────────────────────
        const wbDiff = Math.abs(userSettings.wb - ideal.wb);
        let wbScore;
        if (wbDiff <= range.wb) {
            wbScore = 5;
        } else if (wbDiff <= range.wb + 1) {
            wbScore = 3;
            const userWBTemp = WB_STOPS[userSettings.wb];
            const idealWBTemp = WB_STOPS[ideal.wb];
            if (userWBTemp > idealWBTemp) {
                feedback.push({ type: 'info', icon: '🌡️', text: `White balance is a bit warm (${WB_LABELS[userSettings.wb]}). Try ${scene.idealWBName} (${WB_LABELS[ideal.wb]}) for more accurate colors.` });
            } else {
                feedback.push({ type: 'info', icon: '🌡️', text: `White balance is a bit cool (${WB_LABELS[userSettings.wb]}). Try ${scene.idealWBName} (${WB_LABELS[ideal.wb]}) for warmer tones.` });
            }
        } else {
            wbScore = 0;
            feedback.push({ type: 'warning', icon: '🎨', text: `White balance (${WB_LABELS[userSettings.wb]}) gives unnatural colors. The ideal is ${scene.idealWBName} (${WB_LABELS[ideal.wb]}).` });
        }
        totalScore += wbScore;

        // ── Add a contextual tip ───────────────────────────────
        const tipIndex = Math.min(
            Math.floor((100 - totalScore) / 25),
            scene.tips.length - 1
        );
        if (totalScore < 85) {
            feedback.push({
                type: 'info',
                icon: '💡',
                text: '**Pro Tip:** ' + scene.tips[tipIndex]
            });
        }

        // ── Determine grade ────────────────────────────────────
        let grade, gradeLabel, gradeClass;
        if (totalScore >= 90) {
            grade = 'S'; gradeLabel = 'Perfect Shot!'; gradeClass = 'grade-s';
        } else if (totalScore >= 75) {
            grade = 'A'; gradeLabel = 'Excellent!'; gradeClass = 'grade-a';
        } else if (totalScore >= 55) {
            grade = 'B'; gradeLabel = 'Good Shot'; gradeClass = 'grade-b';
        } else if (totalScore >= 35) {
            grade = 'C'; gradeLabel = 'Needs Work'; gradeClass = 'grade-c';
        } else {
            grade = 'D'; gradeLabel = 'Keep Practicing'; gradeClass = 'grade-d';
        }

        return {
            score: totalScore,
            grade,
            gradeLabel,
            gradeClass,
            feedback,
            evDiff,
            isPassing: totalScore >= 75
        };
    }

    /**
     * Build the settings comparison table data.
     */
    function getSettingsComparison(userSettings, idealSettings) {
        return [
            {
                label: 'ISO',
                user: `ISO ${ISO_STOPS[userSettings.iso]}`,
                ideal: `ISO ${ISO_STOPS[idealSettings.iso]}`,
                diff: Math.abs(userSettings.iso - idealSettings.iso)
            },
            {
                label: 'Aperture',
                user: `f/${APERTURE_STOPS[userSettings.aperture]}`,
                ideal: `f/${APERTURE_STOPS[idealSettings.aperture]}`,
                diff: Math.abs(userSettings.aperture - idealSettings.aperture)
            },
            {
                label: 'Shutter',
                user: SHUTTER_LABELS[userSettings.shutter],
                ideal: SHUTTER_LABELS[idealSettings.shutter],
                diff: Math.abs(userSettings.shutter - idealSettings.shutter)
            },
            {
                label: 'WB',
                user: WB_LABELS[userSettings.wb],
                ideal: WB_LABELS[idealSettings.wb],
                diff: Math.abs(userSettings.wb - idealSettings.wb)
            }
        ];
    }

    return {
        calcEV,
        getExposureDiff,
        getImageFilters,
        getNoiseLevel,
        renderNoise,
        gradeShot,
        getSettingsComparison
    };
})();
