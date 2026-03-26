/* ═══════════════════════════════════════════════════════════
   PhotoCoach — Main Application Controller
   ═══════════════════════════════════════════════════════════ */

(() => {
    'use strict';

    // ── State ──────────────────────────────────────────────
    let currentSceneIndex = 0;
    let sceneOrder = [];
    let totalScore = 0;
    let attempts = 0;
    let perfectShots = 0;
    let scenesCompleted = 0;
    let bestScores = {};

    // ── DOM References ─────────────────────────────────────
    const $ = (sel) => document.querySelector(sel);
    const $$ = (sel) => document.querySelectorAll(sel);

    const dom = {
        loadingScreen: $('#loading-screen'),
        app: $('#app'),

        // Header
        currentSceneNum: $('#current-scene-num'),
        totalScenes: $('#total-scenes'),
        scoreValue: $('#score-value'),

        // Scene info
        sceneBadge: $('#scene-badge'),
        sceneTitle: $('#scene-title'),
        sceneDescription: $('#scene-description'),
        sceneImage: $('#scene-image'),

        // HUD
        hudISO: $('#hud-iso'),
        hudAperture: $('#hud-aperture'),
        hudShutter: $('#hud-shutter'),
        hudEV: $('#hud-ev'),

        // Meter
        meterNeedle: $('#meter-needle'),

        // Sliders
        isoSlider: $('#iso-slider'),
        apertureSlider: $('#aperture-slider'),
        shutterSlider: $('#shutter-slider'),
        wbSlider: $('#wb-slider'),

        // Value displays
        isoValue: $('#iso-value'),
        apertureValue: $('#aperture-value'),
        shutterValue: $('#shutter-value'),
        wbValue: $('#wb-value'),

        // Buttons
        btnShoot: $('#btn-shoot'),
        btnReset: $('#btn-reset'),
        btnSkip: $('#btn-skip'),
        btnRetry: $('#btn-retry'),
        btnNext: $('#btn-next'),
        btnRestart: $('#btn-restart'),

        // Result modal
        resultModal: $('#result-modal'),
        resultGrade: $('#result-grade'),
        resultImage: $('#result-image'),
        noiseCanvas: $('#noise-canvas'),
        feedbackList: $('#feedback-list'),
        settingsComparison: $('#settings-comparison'),

        // Completion modal
        completionModal: $('#completion-modal'),
        finalScore: $('#final-score'),
        completionStats: $('#completion-stats'),

        // Upload modal
        uploadModal: $('#upload-modal'),
        uploadBackdrop: $('#upload-backdrop'),
        uploadDropzone: $('#upload-dropzone'),
        fileInput: $('#file-input'),
        btnChooseFile: $('#btn-choose-file'),
        btnUpload: $('#btn-upload'),
        btnUploadCancel: $('#btn-upload-cancel'),
        btnUploadStart: $('#btn-upload-start'),
        uploadPreviewArea: $('#upload-preview-area'),
        uploadPreviewImg: $('#upload-preview-img'),
        uploadSceneName: $('#upload-scene-name'),
        uploadSceneCategory: $('#upload-scene-category'),
        uploadSceneDesc: $('#upload-scene-desc')
    };

    // ── Upload State ────────────────────────────────────────
    let uploadedImageDataUrl = null;

    // ── Initialization ─────────────────────────────────────
    function init() {
        // Shuffle scenes
        sceneOrder = shuffleArray([...Array(SCENES.length).keys()]);

        dom.totalScenes.textContent = SCENES.length;

        // Bind events
        dom.isoSlider.addEventListener('input', onSettingsChange);
        dom.apertureSlider.addEventListener('input', onSettingsChange);
        dom.shutterSlider.addEventListener('input', onSettingsChange);
        dom.wbSlider.addEventListener('input', onSettingsChange);

        dom.btnShoot.addEventListener('click', onShoot);
        dom.btnReset.addEventListener('click', resetSettings);
        dom.btnSkip.addEventListener('click', nextScene);
        dom.btnRetry.addEventListener('click', onRetry);
        dom.btnNext.addEventListener('click', () => {
            closeModal(dom.resultModal);
            nextScene();
        });
        dom.btnRestart.addEventListener('click', () => {
            closeModal(dom.completionModal);
            restartSession();
        });

        // Upload button
        dom.btnUpload.addEventListener('click', () => openUploadModal());
        dom.uploadBackdrop.addEventListener('click', closeUploadModal);
        dom.btnUploadCancel.addEventListener('click', closeUploadModal);
        dom.btnChooseFile.addEventListener('click', () => dom.fileInput.click());
        dom.fileInput.addEventListener('change', (e) => handleFileSelect(e.target.files[0]));
        dom.btnUploadStart.addEventListener('click', startCustomScene);

        // Drag and drop
        dom.uploadDropzone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dom.uploadDropzone.classList.add('drag-over');
        });
        dom.uploadDropzone.addEventListener('dragleave', () => {
            dom.uploadDropzone.classList.remove('drag-over');
        });
        dom.uploadDropzone.addEventListener('drop', (e) => {
            e.preventDefault();
            dom.uploadDropzone.classList.remove('drag-over');
            const file = e.dataTransfer.files[0];
            if (file && file.type.startsWith('image/')) handleFileSelect(file);
        });
        dom.uploadDropzone.addEventListener('click', (e) => {
            if (e.target !== dom.btnChooseFile) dom.fileInput.click();
        });

        // Load first scene
        loadScene(0);

        // Fade in app
        setTimeout(() => {
            dom.loadingScreen.classList.add('fade-out');
            dom.app.classList.remove('hidden');
        }, 1800);

        // Remove loading screen after animation
        setTimeout(() => {
            dom.loadingScreen.style.display = 'none';
        }, 2400);
    }

    // ── Scene Loading ──────────────────────────────────────
    function loadScene(index) {
        if (index >= SCENES.length) {
            showCompletion();
            return;
        }

        currentSceneIndex = index;
        const scene = SCENES[sceneOrder[index]];

        dom.currentSceneNum.textContent = index + 1;
        dom.sceneBadge.textContent = scene.category;
        dom.sceneTitle.textContent = scene.title;
        dom.sceneDescription.textContent = scene.description;

        // Load image
        dom.sceneImage.style.filter = 'none';
        dom.sceneImage.style.opacity = '0';
        dom.sceneImage.src = scene.image;
        dom.sceneImage.onload = () => {
            dom.sceneImage.style.opacity = '1';
        };
        // Handle cross-origin for URLs
        if (scene.image.startsWith('http')) {
            dom.sceneImage.crossOrigin = 'anonymous';
        }

        // Reset settings to defaults
        resetSettings();
    }

    function nextScene() {
        scenesCompleted++;
        loadScene(currentSceneIndex + 1);
    }

    // ── Settings Control ───────────────────────────────────
    function getUserSettings() {
        return {
            iso: parseInt(dom.isoSlider.value),
            aperture: parseInt(dom.apertureSlider.value),
            shutter: parseInt(dom.shutterSlider.value),
            wb: parseInt(dom.wbSlider.value)
        };
    }

    function resetSettings() {
        dom.isoSlider.value = 0;
        dom.apertureSlider.value = 5;
        dom.shutterSlider.value = 8;
        dom.wbSlider.value = 3;
        onSettingsChange();
    }

    function onSettingsChange() {
        const settings = getUserSettings();
        const scene = SCENES[sceneOrder[currentSceneIndex]];

        // Update value displays
        dom.isoValue.textContent = ISO_STOPS[settings.iso];
        dom.apertureValue.textContent = `f/${APERTURE_STOPS[settings.aperture]}`;
        dom.shutterValue.textContent = SHUTTER_LABELS[settings.shutter];
        dom.wbValue.textContent = WB_LABELS[settings.wb];

        // Update HUD
        dom.hudISO.textContent = `ISO ${ISO_STOPS[settings.iso]}`;
        dom.hudAperture.textContent = `f/${APERTURE_STOPS[settings.aperture]}`;
        dom.hudShutter.textContent = SHUTTER_LABELS[settings.shutter];

        // Calculate EV diff
        const evDiff = ExposureEngine.getExposureDiff(settings, scene.idealSettings);
        const absEV = Math.abs(evDiff);

        // Update EV indicator
        dom.hudEV.textContent = `EV ${evDiff > 0 ? '+' : ''}${evDiff.toFixed(1)}`;
        dom.hudEV.className = 'hud-item ev-indicator';
        if (absEV <= 0.5) {
            dom.hudEV.classList.add(''); // green (default)
        } else if (evDiff > 0) {
            dom.hudEV.classList.add('over');
        } else {
            dom.hudEV.classList.add('under');
        }

        // Update exposure meter needle
        // EV range is roughly -5 to +5, map to 0% - 100%
        const meterPos = Math.max(0, Math.min(100, 50 + evDiff * 8.33));
        dom.meterNeedle.style.left = `${meterPos}%`;

        // Live preview: apply subtle filter to viewfinder
        const previewFilters = ExposureEngine.getImageFilters(settings, scene.idealSettings, scene);
        dom.sceneImage.style.filter = previewFilters;
    }

    // ── Shooting ───────────────────────────────────────────
    function onShoot() {
        const settings = getUserSettings();
        const scene = SCENES[sceneOrder[currentSceneIndex]];

        // Shooting animation
        dom.btnShoot.classList.add('shooting');
        setTimeout(() => dom.btnShoot.classList.remove('shooting'), 400);

        // Flash effect
        const flash = document.createElement('div');
        flash.className = 'flash-overlay';
        document.body.appendChild(flash);
        setTimeout(() => flash.remove(), 600);

        // Grade the shot
        const result = ExposureEngine.gradeShot(settings, scene);
        attempts++;

        // Track best score per scene
        const sceneId = scene.id;
        if (!bestScores[sceneId] || result.score > bestScores[sceneId]) {
            bestScores[sceneId] = result.score;
        }

        if (result.isPassing) {
            perfectShots++;
        }

        // Update total score
        totalScore = Object.values(bestScores).reduce((sum, s) => sum + s, 0);
        dom.scoreValue.textContent = totalScore;

        // Show result after brief delay
        setTimeout(() => showResult(settings, scene, result), 400);
    }

    // ── Result Display ─────────────────────────────────────
    function showResult(settings, scene, result) {
        // Set grade
        const gradeLetter = dom.resultGrade.querySelector('.grade-letter');
        const gradeLabel = dom.resultGrade.querySelector('.grade-label');
        gradeLetter.textContent = result.grade;
        gradeLetter.className = `grade-letter ${result.gradeClass}`;
        gradeLabel.textContent = result.gradeLabel;

        // Set result image with filters
        dom.resultImage.src = scene.image;
        if (scene.image.startsWith('http')) {
            dom.resultImage.crossOrigin = 'anonymous';
        }
        const filters = ExposureEngine.getImageFilters(settings, scene.idealSettings, scene);
        dom.resultImage.style.filter = filters;

        // Noise overlay
        const noiseLevel = ExposureEngine.getNoiseLevel(settings.iso);
        ExposureEngine.renderNoise(dom.noiseCanvas, noiseLevel);

        // Feedback list
        dom.feedbackList.innerHTML = '';
        result.feedback.forEach(item => {
            const div = document.createElement('div');
            div.className = `feedback-item ${item.type}`;
            div.innerHTML = `
                <span class="feedback-icon">${item.icon}</span>
                <span>${formatFeedbackText(item.text)}</span>
            `;
            dom.feedbackList.appendChild(div);
        });

        // Settings comparison
        const comparison = ExposureEngine.getSettingsComparison(settings, scene.idealSettings);
        dom.settingsComparison.innerHTML = '';
        comparison.forEach(row => {
            const div = document.createElement('div');
            div.className = 'setting-compare-row';

            let matchClass = 'setting-compare-match';
            if (row.diff === 0) matchClass = 'setting-compare-match';
            else if (row.diff <= 1) matchClass = 'setting-compare-close';
            else matchClass = 'setting-compare-off';

            div.innerHTML = `
                <span class="setting-compare-label">${row.label}</span>
                <span class="setting-compare-user ${matchClass}">${row.user}</span>
                <span class="setting-compare-ideal">${row.ideal} ✓</span>
            `;
            dom.settingsComparison.appendChild(div);
        });

        // Show/hide next button based on pass
        dom.btnNext.style.display = result.isPassing ? 'flex' : 'none';
        dom.btnRetry.textContent = result.isPassing ? 'Try Again' : 'Try Again';

        openModal(dom.resultModal);
    }

    function onRetry() {
        closeModal(dom.resultModal);
        resetSettings();
    }

    // ── Completion Screen ──────────────────────────────────
    function showCompletion() {
        const finalScoreValue = dom.finalScore.querySelector('.final-score-value');
        const finalScoreMax = dom.finalScore.querySelector('.final-score-max');
        finalScoreValue.textContent = totalScore;
        finalScoreMax.textContent = `/ ${SCENES.length * 100}`;

        dom.completionStats.innerHTML = `
            <div class="stat-card">
                <div class="stat-value">${attempts}</div>
                <div class="stat-label">Total Shots</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${perfectShots}</div>
                <div class="stat-label">Passing Shots</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${Math.round(totalScore / SCENES.length)}</div>
                <div class="stat-label">Avg Score</div>
            </div>
        `;

        openModal(dom.completionModal);
    }

    function restartSession() {
        currentSceneIndex = 0;
        sceneOrder = shuffleArray([...Array(SCENES.length).keys()]);
        totalScore = 0;
        attempts = 0;
        perfectShots = 0;
        scenesCompleted = 0;
        bestScores = {};
        dom.scoreValue.textContent = '0';
        loadScene(0);
    }

    // ── Modal Helpers ──────────────────────────────────────
    function openModal(modal) {
        modal.classList.remove('hidden');
    }

    function closeModal(modal) {
        modal.classList.add('hidden');
    }

    // ── Utilities ──────────────────────────────────────────
    function shuffleArray(arr) {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }

    function formatFeedbackText(text) {
        // Bold text wrapped in **...**
        return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    }

    // ── Upload Handlers ────────────────────────────────────
    function openUploadModal() {
        // Reset state
        uploadedImageDataUrl = null;
        dom.uploadPreviewArea.classList.add('hidden');
        dom.uploadDropzone.style.display = '';
        dom.btnUploadStart.disabled = true;
        dom.uploadSceneName.value = '';
        dom.uploadSceneDesc.value = '';
        dom.fileInput.value = '';
        openModal(dom.uploadModal);
    }

    function closeUploadModal() {
        closeModal(dom.uploadModal);
    }

    function handleFileSelect(file) {
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file (JPG, PNG, WEBP).');
            return;
        }
        if (file.size > 20 * 1024 * 1024) {
            alert('File is too large. Please choose an image under 20MB.');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            uploadedImageDataUrl = e.target.result;
            dom.uploadPreviewImg.src = uploadedImageDataUrl;
            dom.uploadDropzone.style.display = 'none';
            dom.uploadPreviewArea.classList.remove('hidden');
            dom.btnUploadStart.disabled = false;
            // Auto-populate name from filename
            if (!dom.uploadSceneName.value) {
                const name = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
                dom.uploadSceneName.value = name.charAt(0).toUpperCase() + name.slice(1);
            }
        };
        reader.readAsDataURL(file);
    }

    function startCustomScene() {
        if (!uploadedImageDataUrl) return;

        const category = dom.uploadSceneCategory.value;
        const name = dom.uploadSceneName.value.trim() || 'Custom Scene';
        const desc = dom.uploadSceneDesc.value.trim() || `Practice your ${category.toLowerCase()} photography settings on this photo.`;

        // Build smart default ideal settings based on chosen category
        const categoryPresets = {
            'Landscape':     { iso: 0, aperture: 6, shutter: 8,  wb: 3, hasMotion: false, needsSharpBackground: true  },
            'Portrait':      { iso: 1, aperture: 1, shutter: 11, wb: 3, hasMotion: false, needsSharpBackground: false },
            'Sports':        { iso: 3, aperture: 2, shutter: 15, wb: 3, hasMotion: true,  needsSharpBackground: false },
            'Night':         { iso: 4, aperture: 2, shutter: 2,  wb: 2, hasMotion: false, needsSharpBackground: true  },
            'Macro':         { iso: 1, aperture: 5, shutter: 9,  wb: 3, hasMotion: false, needsSharpBackground: false },
            'Low Light':     { iso: 4, aperture: 1, shutter: 9,  wb: 1, hasMotion: true,  needsSharpBackground: false },
            'Street':        { iso: 2, aperture: 3, shutter: 11, wb: 3, hasMotion: true,  needsSharpBackground: false },
            'Wildlife':      { iso: 2, aperture: 3, shutter: 14, wb: 3, hasMotion: true,  needsSharpBackground: false },
            'Long Exposure': { iso: 0, aperture: 8, shutter: 2,  wb: 3, hasMotion: false, needsSharpBackground: true  },
            'Custom':        { iso: 1, aperture: 5, shutter: 9,  wb: 3, hasMotion: false, needsSharpBackground: false }
        };

        const preset = categoryPresets[category] || categoryPresets['Custom'];

        // Build a temporary scene object
        const customScene = {
            id: 'custom_upload_' + Date.now(),
            title: name,
            category: category,
            description: desc,
            image: uploadedImageDataUrl,
            idealSettings: {
                iso:      preset.iso,
                aperture: preset.aperture,
                shutter:  preset.shutter,
                wb:       preset.wb
            },
            acceptableRange: { iso: 1, aperture: 1, shutter: 2, wb: 2 },
            hasMotion: preset.hasMotion,
            needsSharpBackground: preset.needsSharpBackground,
            idealWBName: 'Based on scene type',
            tips: [
                `For ${category} photography, the recommended settings are a starting point.`,
                `Experiment to find what works best for this specific image.`,
                `Pay attention to the exposure meter — your EV offset tells you a lot.`,
                `The ideal settings shown are based on the "${category}" scene preset.`
            ],
            isCustom: true
        };

        closeUploadModal();

        // Inject as current scene (without incrementing the official counter)
        const sceneImageEl = dom.sceneImage;
        sceneImageEl.style.opacity = '0';
        sceneImageEl.src = customScene.image;
        sceneImageEl.onload = () => { sceneImageEl.style.opacity = '1'; };

        dom.sceneBadge.textContent = customScene.category + ' · Custom';
        dom.sceneTitle.textContent = customScene.title;
        dom.sceneDescription.textContent = customScene.description;

        // Temporarily replace current scene in SCENES + sceneOrder
        // We inject it as a new entry at index 0 and offset currentSceneIndex
        SCENES.unshift(customScene);
        sceneOrder.unshift(0);
        // Shift all other indices by 1
        for (let i = 1; i < sceneOrder.length; i++) sceneOrder[i]++;

        resetSettings();
    }

    // ── Start ──────────────────────────────────────────────
    document.addEventListener('DOMContentLoaded', init);
})();
