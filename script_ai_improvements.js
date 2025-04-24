// AI feature improvements for MindMesh dashboard

document.addEventListener('DOMContentLoaded', () => {
    // Helper function to display error messages in UI
    function displayError(message, containerId) {
        const container = document.getElementById(containerId);
        if (container) {
            container.textContent = message;
            container.classList.remove('hidden');
        } else {
            console.error('Error container not found:', containerId);
        }
    }

    // Helper function to show loading message
    function showLoading(containerId, message = 'Loading...') {
        const container = document.getElementById(containerId);
        if (container) {
            container.textContent = message;
            container.classList.remove('hidden');
        }
    }

    // Helper function to clear message
    function clearMessage(containerId) {
        const container = document.getElementById(containerId);
        if (container) {
            container.textContent = '';
            container.classList.add('hidden');
        }
    }

    // Mood check-in form improvements
    const moodForm = document.getElementById('mood-form');
    const moodResult = document.getElementById('mood-result');
    const moodActionSuggestions = document.getElementById('mood-action-suggestions');

    if (moodForm) {
        moodForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const text = document.getElementById('mood-text').value.trim();
            if (!text) {
                displayError('Please enter your mood description.', 'mood-error');
                return;
            }
            clearMessage('mood-error');
            showLoading('mood-result', 'Analyzing mood...');
            const response = await fetch('/api/mood', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({text})
            });
            if (response.ok) {
                const data = await response.json();
                if (moodResult) {
                    moodResult.innerHTML = `<p><strong>Sentiment:</strong> ${data.sentiment} ${data.emoji}</p>
                        <p><strong>Intensity:</strong> ${data.intensity}</p>
                        <p><strong>Tips:</strong></p><ul>${data.tips.map(t => `<li>${t}</li>`).join('')}</ul>
                        <p><strong>Suggested Activities:</strong></p><ul>${data.suggested_activities.map(a => `<li>${a}</li>`).join('')}</ul>`;
                    moodResult.classList.remove('hidden');
                }

                // Get mood-to-action suggestions
                showLoading('mood-action-suggestions', 'Getting suggestions...');
                const moodBoostResp = await fetch('/mood_boost', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({mood: text})
                });
                if (moodBoostResp.ok) {
                    const boostData = await moodBoostResp.json();
                    if (moodActionSuggestions) {
                        moodActionSuggestions.textContent = boostData.suggestions;
                        moodActionSuggestions.classList.remove('hidden');
                    }
                } else {
                    displayError('Failed to get mood boost suggestions', 'mood-error');
                }
            } else {
                displayError('Failed to analyze mood', 'mood-error');
            }
        });
    }

    // Morning check-in form improvements
    const morningCheckinForm = document.getElementById('morning-checkin-form');
    const dailyPlanDiv = document.getElementById('daily-plan');

    if (morningCheckinForm) {
        morningCheckinForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const mood = document.getElementById('morning-mood').value.trim();
            const goal = document.getElementById('morning-goal').value.trim();
            if (!mood || !goal) {
                displayError('Please enter both mood and goal.', 'morning-checkin-error');
                return;
            }
            clearMessage('morning-checkin-error');
            showLoading('daily-plan', 'Generating daily plan...');
            // Save check-in
            const saveResp = await fetch('/save_checkin', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({mood, goal})
            });
            if (!saveResp.ok) {
                displayError('Failed to save check-in', 'morning-checkin-error');
                return;
            }
            // Get daily plan
            const planResp = await fetch('/api/morning_checkin', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({mood, goal})
            });
            if (planResp.ok) {
                const data = await planResp.json();
                if (dailyPlanDiv) {
                    dailyPlanDiv.textContent = data.daily_plan;
                    dailyPlanDiv.classList.remove('hidden');
                }
                clearMessage('morning-checkin-error');
            } else {
                displayError('Failed to get daily plan', 'morning-checkin-error');
            }
        });
    }

    // Task suggestions button improvements
    const taskSuggestionsBtn = document.getElementById('get-task-suggestions');
    const taskSuggestionsResult = document.getElementById('task-suggestions-result');

    if (taskSuggestionsBtn) {
        taskSuggestionsBtn.addEventListener('click', async () => {
            showLoading('task-suggestions-result', 'Fetching tasks...');
            const response = await fetch('/api/schedules');
            if (!response.ok) {
                displayError('Failed to fetch tasks', 'task-suggestions-error');
                return;
            }
            const tasks = await response.json();
            const currentTime = new Date().toLocaleString();
            const taskTitles = tasks.map(t => t.title);
            const suggestResp = await fetch('/get_schedule', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({tasks: taskTitles, current_time: currentTime})
            });
            if (suggestResp.ok) {
                const data = await suggestResp.json();
                if (taskSuggestionsResult) {
                    taskSuggestionsResult.textContent = data.plan;
                    taskSuggestionsResult.classList.remove('hidden');
                }
                clearMessage('task-suggestions-error');
            } else {
                displayError('Failed to get task suggestions', 'task-suggestions-error');
            }
        });
    }

    // Emotion-synced plan button improvements
    const emotionPlanBtn = document.getElementById('get-emotion-plan');
    const emotionPlanResult = document.getElementById('emotion-plan-result');

    if (emotionPlanBtn) {
        emotionPlanBtn.addEventListener('click', async () => {
            const moodText = document.getElementById('mood-text') ? document.getElementById('mood-text').value.trim() : 'neutral';
            showLoading('emotion-plan-result', 'Fetching emotion-synced plan...');
            const response = await fetch('/api/schedules');
            if (!response.ok) {
                displayError('Failed to fetch tasks', 'emotion-plan-error');
                return;
            }
            const tasks = await response.json();
            const taskTitles = tasks.map(t => t.title);
            const planResp = await fetch('/api/emotion_synced_plan', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({mood: moodText, tasks: taskTitles})
            });
            if (planResp.ok) {
                const data = await planResp.json();
                if (emotionPlanResult) {
                    emotionPlanResult.textContent = data.adjusted_plan;
                    emotionPlanResult.classList.remove('hidden');
                }
                clearMessage('emotion-plan-error');
            } else {
                displayError('Failed to get emotion-synced plan', 'emotion-plan-error');
            }
        });
    }
});
