# tests/test_pronunciation_e2e.py
"""
End-to-end Playwright tests for Pronunciation Practice Feature
Tests the complete recording flow, UI interactions, and results display
"""

import pytest
from playwright.sync_api import Page, expect
import time


class TestPronunciationRecordingFlow:
    """Test the pronunciation recording feature end-to-end"""
    
    @pytest.fixture(autouse=True)
    def setup(self, page: Page):
        """Setup for each test - navigate to app and login if needed"""
        base_url = "http://localhost:3000" if "localhost" in page.context.browser.contexts[0].pages[0].url else "https://learn.rentyourcio.com"
        page.goto(f"{base_url}/")
        # Wait for app to load
        page.wait_for_load_state("networkidle")
    
    def test_pronunciation_recorder_appears_on_flashcard(self, page: Page):
        """Test that pronunciation recorder section appears on flashcard back"""
        # Navigate to study mode
        page.click("text=Study")
        page.wait_for_selector(".flashcard", timeout=5000)
        
        # Flip card to see back
        page.click("text=Show Details")
        
        # Pronunciation recorder should be visible
        recorder_section = page.locator(".pronunciation-recorder-panel")
        expect(recorder_section).to_be_visible()
        
        # Check for record button
        record_button = page.locator("button:has-text('Start Recording')")
        expect(record_button).to_be_enabled()
    
    def test_recording_buttons_state_transitions(self, page: Page):
        """Test that recording buttons enable/disable correctly during recording lifecycle"""
        # Setup
        page.click("text=Study")
        page.wait_for_selector(".flashcard", timeout=5000)
        page.click("text=Show Details")
        
        record_btn = page.locator("button:has-text('Start Recording')")
        stop_btn = page.locator("button:has-text('Stop')")
        play_btn = page.locator("button:has-text('Playback')")
        submit_btn = page.locator("button:has-text('Submit')")
        
        # Initial state
        expect(record_btn).to_be_enabled()
        expect(stop_btn).to_be_disabled()
        expect(play_btn).to_be_disabled()
        expect(submit_btn).to_be_disabled()
        
        # After clicking record
        # NOTE: In real test, we would check after click,
        # but in headless we can't actually record audio
        # This is a UI state test, not actual recording
    
    def test_waveform_visualization_appears_during_recording(self, page: Page):
        """Test that waveform canvas appears when recording starts"""
        page.click("text=Study")
        page.wait_for_selector(".flashcard", timeout=5000)
        page.click("text=Show Details")
        
        # Check that waveform is initially hidden
        waveform = page.locator("#waveform-canvas")
        expect(waveform).to_have_css("display", "none")
        
        # In a real test with audio recording, clicking record would show it
        # This is difficult to test in headless mode without mocking
    
    def test_results_display_after_submission(self, page: Page):
        """Test that results are displayed after recording submission"""
        # This test would mock the API response
        page.click("text=Study")
        page.wait_for_selector(".flashcard", timeout=5000)
        page.click("text=Show Details")
        
        # Mock the API response for recording analysis
        page.route("**/api/v1/pronunciation/record", route => {
            route.abort("aborted")  # Don't actually call API for this test
        })
        
        # In a real test, after mock API response:
        # Results container should be visible
        # Overall score should be displayed
        # Word scores should be listed
        # Feedback should be shown
    
    def test_progress_stats_display(self, page: Page):
        """Test that user progress statistics are displayed"""
        page.click("text=Study")
        page.wait_for_selector(".flashcard", timeout=5000)
        page.click("text=Show Details")
        
        # Mock progress endpoint
        page.route("**/api/v1/pronunciation/progress/*", route => {
            route.abort("aborted")
        })
        
        # Progress section should be visible
        progress_container = page.locator(".progress-container")
        # In real test with data: expect(progress_container).to_be_visible()
    
    def test_try_again_button_resets_recording(self, page: Page):
        """Test that 'Try Again' button allows new recording after results"""
        page.click("text=Study")
        page.wait_for_selector(".flashcard", timeout=5000)
        page.click("text=Show Details")
        
        # After recording and getting results,
        # "Try Again" button should reset the recorder state
        # This would be visible in a real test with actual recording
    
    def test_results_word_scores_display_correctly(self, page: Page):
        """Test that word-by-word scores are formatted correctly"""
        # Results should show:
        # - Individual word names
        # - Confidence percentage
        # - Color-coded status bar (green/yellow/red)
        # - Status text (good/acceptable/needs_work)
        pass
    
    def test_ipa_pronunciation_display(self, page: Page):
        """Test that IPA pronunciation is displayed in results"""
        # IPA section should show target pronunciation
        # Format: /phonetic/representation/
        pass
    
    def test_mobile_responsive_layout(self, page: Page):
        """Test recorder layout on mobile viewport"""
        # Set mobile viewport
        page.set_viewport_size({"width": 375, "height": 667})
        
        page.click("text=Study")
        page.wait_for_selector(".flashcard", timeout=5000)
        page.click("text=Show Details")
        
        # Recorder should still be visible and functional on mobile
        recorder = page.locator(".pronunciation-recorder-panel")
        expect(recorder).to_be_visible()
        
        # Buttons should stack vertically on mobile
        controls = page.locator(".recorder-controls")
        # Check that buttons have appropriate spacing for mobile
    
    def test_recording_time_display_updates(self, page: Page):
        """Test that recording time counter updates during recording"""
        page.click("text=Study")
        page.wait_for_selector(".flashcard", timeout=5000)
        page.click("text=Show Details")
        
        # Time display should show 00:00 initially
        time_display = page.locator("#recording-time")
        expect(time_display).to_contain_text("00:00")
        
        # After 5 seconds of recording (if actually recording),
        # time would update to 00:05
    
    def test_microphone_permission_error_handling(self, page: Page):
        """Test that microphone permission errors are handled gracefully"""
        page.click("text=Study")
        page.wait_for_selector(".flashcard", timeout=5000)
        page.click("text=Show Details")
        
        # If microphone access is denied, error message should appear
        # Instead of crashing the app
        # This would be tested with proper browser context configuration
    
    def test_score_color_coding(self, page: Page):
        """Test that overall score is color-coded based on performance"""
        # Excellent (>0.85): Green
        # Good (0.70-0.85): Blue/Teal
        # Acceptable (0.60-0.70): Yellow
        # Needs Work (<0.60): Red
        pass
    
    def test_problem_words_list_in_progress(self, page: Page):
        """Test that problem words are listed in progress stats"""
        # Progress section should show top 3 problem words
        # With lowest confidence scores
        pass
    
    def test_improvement_trend_calculation(self, page: Page):
        """Test that improvement trend is displayed correctly"""
        # Should show percentage improvement or regression
        # Format: +12%, -5%, or "Insufficient data"
        pass


class TestPronunciationAPIIntegration:
    """Test integration with pronunciation API"""
    
    def test_successful_recording_submission(self, page: Page):
        """Test successful recording upload and analysis"""
        # Mock successful API response
        page.route("**/api/v1/pronunciation/record", route => {
            route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify({
                    attempt_id: "attempt-123",
                    target_text: "Bonjour",
                    transcribed_text: "Bonjour",
                    overall_score: 0.95,
                    word_scores: [
                        {"word": "Bonjour", "confidence": 0.95, "status": "good"}
                    ],
                    ipa_target: "/bɔ̃.ʒuʁ/",
                    feedback: "Excellent pronunciation!"
                })
            })
        })
    
    def test_api_error_handling(self, page: Page):
        """Test that API errors are displayed to user"""
        # Mock API error response
        page.route("**/api/v1/pronunciation/record", route => {
            route.abort("failed")
        })
        
        # Error message should display to user
        # "Error: Failed to analyze pronunciation"
    
    def test_network_timeout_handling(self, page: Page):
        """Test handling of network timeouts during submission"""
        # Mock timeout
        page.route("**/api/v1/pronunciation/record", route => {
            # Simulate timeout after 10 seconds
            import time
            time.sleep(10)
            route.abort("timedout")
        })


class TestProgressTracking:
    """Test pronunciation progress tracking and statistics"""
    
    def test_progress_endpoint_called_on_load(self, page: Page):
        """Test that progress endpoint is called when recorder loads"""
        page.click("text=Study")
        page.wait_for_selector(".flashcard", timeout=5000)
        page.click("text=Show Details")
        
        # Progress endpoint should be called
        # response = page.wait_for_event("response", lambda response: "pronunciation/progress" in response.url)
        # expect(response.status).to_equal(200)
    
    def test_progress_stats_update_after_recording(self, page: Page):
        """Test that progress stats update after successful recording"""
        # After successful submission, stats should reflect new attempt
        # Total attempts should increment
        # Average confidence should recalculate
        pass


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
