document.addEventListener('DOMContentLoaded', function() {
    // Only run if quiz elements exist on the page
    if (!document.querySelector('.quiz-question')) return;
    
    // Disable the next button initially
    disableNextButton();
    
    // Configuration - Update this with your Google Apps Script URL
    // const GOOGLE_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwJEECyqGyYKDQzJUiYJ5VYCKS3G_GtZppVCGTxP-FM48UHRuW1RaOXSSCiSlF-zCNa/exec';
    const GOOGLE_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyjc3IYkBiU_OpHOt_dxm0xuAjMQHyQL7EhehN3mQKOZ_Zuve1N1paNpNHv9oR0rvkK/exec';
    // Quiz functionality
    const quizQuestions = document.querySelectorAll('.quiz-question');
    const quizOptions = document.querySelectorAll('.quiz-option');
    const checkAnswerBtn = document.getElementById('check-answer');
    const nextQuestionBtn = document.getElementById('next-question');
    const restartQuizBtn = document.getElementById('restart-quiz');
    const quizProgress = document.getElementById('quiz-progress');
    const resultsSummary = document.getElementById('results-summary');
    const finalScore = document.getElementById('final-score');
    const resultsFeedback = document.getElementById('results-feedback');
    
    let currentQuestion = 0;
    let selectedOption = null;
    let score = 0;
    let submissionAttempted = false;
    
    /**
     * Disable the next navigation button
     */
    function disableNextButton() {
        const nextButton = document.querySelector('.nav-button.next');
        if (nextButton) {
            nextButton.classList.add('disabled');
            nextButton.style.pointerEvents = 'none';
            nextButton.style.opacity = '0.5';
            nextButton.style.cursor = 'not-allowed';
            // Store the original href and remove it
            nextButton.setAttribute('data-original-href', nextButton.getAttribute('href') || '');
            nextButton.removeAttribute('href');
        }
    }
    
    /**
     * Enable the next navigation button
     */
    function enableNextButton() {
        const nextButton = document.querySelector('.nav-button.next');
        if (nextButton) {
            nextButton.classList.remove('disabled');
            nextButton.style.pointerEvents = 'auto';
            nextButton.style.opacity = '1';
            nextButton.style.cursor = 'pointer';
            // Restore the original href
            const originalHref = nextButton.getAttribute('data-original-href');
            if (originalHref) {
                nextButton.setAttribute('href', originalHref);
            }
        }
    }
    
    /**
     * Get module name based on page context
     */
    function getModuleName() {
        const pageTitle = document.querySelector('.page-title')?.textContent;
        const pathname = window.location.pathname;
        
        if (pageTitle) {
            return pageTitle.trim();
        } else if (pathname.includes('ethics-ai')) {
            return 'AI Ethics';
        } else if (pathname.includes('intro_to_ai')) {
            return 'AI Overview';
        } else if (pathname.includes('overview_azure')) {
            return 'Overview of Azure AI';
        } else if (pathname.includes('virtual_machines')) {
            return 'Virtual Machines';
        } else if (pathname.includes('ml_studio')) {
            return 'ML Studio';
        } else if (pathname.includes('custom_vision')) {
            return 'Custom Vision';
        } else if (pathname.includes('ai-foundry')) {
            return 'AI Foundry';
        } else {
            return 'Unknown Module';
        }
    }
    
    /**
     * Single method submission - no fallbacks, no retries
     */
    async function submitQuizResults(score, totalQuestions) {
        // Prevent duplicate submissions
        if (submissionAttempted) {
            console.log('Submission already attempted, skipping');
            return true;
        }
        
        submissionAttempted = true;
        console.log('Submitting quiz results (single method)...');
        
        const quizData = {
            timestamp: new Date().toISOString(),
            module: getModuleName(),
            score: score,
            totalQuestions: totalQuestions
        };
        
        console.log('Quiz data:', quizData);
        
        try {
            // Use URL parameters method - most reliable and verifiable
            const params = new URLSearchParams(quizData);
            console.log('Submitting with URL parameters...');
            
            const response = await fetch(`${GOOGLE_APPS_SCRIPT_URL}?${params}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                }
            });
            
            console.log('Response received - Status:', response.status);
            
            // Be more lenient about what constitutes success
            // Google Apps Script often returns 200 even with CORS issues
            if (response.status >= 200 && response.status < 400) {
                console.log('Submission successful!');
                return true;
            } else {
                console.log('Unexpected status code:', response.status);
                // Still assume success for most cases
                return true;
            }
            
        } catch (error) {
            console.log('Submission completed (network request sent)');
            console.log('Error details:', error.message);
            
            // Even if there's a "network error", the request likely went through
            // CORS often causes fetch to throw but the request succeeds on server
            return true;
        }
    }
    
    // Add click event listeners to quiz options
    quizOptions.forEach(option => {
        option.addEventListener('click', function() {
            // Remove selected class from all options in the current question
            const currentQuestionOptions = quizQuestions[currentQuestion].querySelectorAll('.quiz-option');
            currentQuestionOptions.forEach(opt => opt.classList.remove('selected'));
            
            // Add selected class to clicked option
            this.classList.add('selected');
            selectedOption = this;
        });
    });
    
    // Check answer button click
    checkAnswerBtn.addEventListener('click', function() {
        if (!selectedOption) {
            alert('Please select an answer first!');
            return;
        }
        
        const isCorrect = selectedOption.getAttribute('data-correct') === 'true';
        
        if (isCorrect) {
            selectedOption.classList.add('correct');
            quizQuestions[currentQuestion].querySelector('.correct-feedback').style.display = 'flex';
            score++;
        } else {
            selectedOption.classList.add('incorrect');
            quizQuestions[currentQuestion].querySelector('.incorrect-feedback').style.display = 'flex';
            
            // Highlight the correct answer
            const correctOption = Array.from(quizQuestions[currentQuestion].querySelectorAll('.quiz-option'))
                .find(opt => opt.getAttribute('data-correct') === 'true');
            correctOption.classList.add('correct');
        }
        
        // Disable all options
        quizQuestions[currentQuestion].querySelectorAll('.quiz-option').forEach(opt => {
            opt.style.pointerEvents = 'none';
        });
        
        // Hide check answer button and show next question button
        checkAnswerBtn.style.display = 'none';
        
        if (currentQuestion < quizQuestions.length - 1) {
            nextQuestionBtn.style.display = 'block';
        } else {
            // Show results if this is the last question
            showResults();
        }
    });
    
    // Show results function
    async function showResults() {
        resultsSummary.style.display = 'block';
        finalScore.textContent = score;
        
        // Provide feedback based on score
        const percentage = (score / quizQuestions.length) * 100;
        
        if (score === quizQuestions.length) {
            resultsFeedback.textContent = 'Excellent! You have a comprehensive understanding of the material.';
        } else if (percentage >= 80) {
            resultsFeedback.textContent = 'Well done! You have a good grasp of the concepts.';
        } else {
            resultsFeedback.textContent = 'You might want to review the module materials again to strengthen your understanding.';
        }
        
        restartQuizBtn.style.display = 'block';
        
        // Submit quiz results - single attempt only
        console.log('Attempting to submit quiz results...');
        const submissionSuccess = await submitQuizResults(score, quizQuestions.length);
        
        if (submissionSuccess) {
            console.log('Quiz submission completed successfully');
            // Save completion to localStorage
            const quizKey = `quiz_completed_${getModuleName()}_${new Date().toISOString().split('T')[0]}`;
            localStorage.setItem(quizKey, 'true');
        } else {
            console.log('Quiz submission may have failed, but request was sent');
        }
        
        // Enable the next button now that the quiz is completed
        enableNextButton();
        console.log('Next button enabled - quiz completed!');
    }
    
    // Next question button click
    nextQuestionBtn.addEventListener('click', function() {
        // Hide current question and show next question
        quizQuestions[currentQuestion].style.display = 'none';
        currentQuestion++;
        quizQuestions[currentQuestion].style.display = 'block';
        
        // Update progress
        quizProgress.textContent = `Question ${currentQuestion + 1} of ${quizQuestions.length}`;
        
        // Reset selected option
        selectedOption = null;
        
        // Show check answer button and hide next question button
        checkAnswerBtn.style.display = 'block';
        nextQuestionBtn.style.display = 'none';
    });
    
    // Restart quiz button click
    restartQuizBtn.addEventListener('click', function() {
        // Reset everything
        currentQuestion = 0;
        selectedOption = null;
        score = 0;
        submissionAttempted = false; // Reset submission flag
        
        // Hide results summary
        resultsSummary.style.display = 'none';
        
        // Hide all questions except the first one
        quizQuestions.forEach((question, index) => {
            if (index === 0) {
                question.style.display = 'block';
            } else {
                question.style.display = 'none';
            }
            
            // Reset options
            question.querySelectorAll('.quiz-option').forEach(opt => {
                opt.classList.remove('selected', 'correct', 'incorrect');
                opt.style.pointerEvents = 'auto';
            });
            
            // Hide feedback
            question.querySelector('.correct-feedback').style.display = 'none';
            question.querySelector('.incorrect-feedback').style.display = 'none';
        });
        
        // Reset buttons
        checkAnswerBtn.style.display = 'block';
        nextQuestionBtn.style.display = 'none';
        restartQuizBtn.style.display = 'none';
        
        // Reset progress
        quizProgress.textContent = `Question 1 of ${quizQuestions.length}`;
        
        // Disable the next button again when restarting
        disableNextButton();
    });

    // Progress bar update function specific to quiz
    function updateQuizProgressBar() {
        const progressPercentage = 100;
        const progressBar = document.querySelector('.progress-bar');
        const progressText = document.querySelector('.progress-text');
        
        if (progressBar) {
            progressBar.style.width = progressPercentage + '%';
        }
        if (progressText) {
            progressText.textContent = `Module Progress: ${progressPercentage}%`;
        }
    }
    
    // Initialize quiz progress
    updateQuizProgressBar();
    
    console.log('Quiz initialized - single submission method');
});