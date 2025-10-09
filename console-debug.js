// Copy and paste this script into the browser console on the main app page (http://localhost:8000/)
// to debug the edit modal button issue

console.log('=== EDIT MODAL BUTTON DEBUG SCRIPT ===');

// Check if elements exist
const generateBtn = document.getElementById('generate-edit-image-btn');
const regenerateBtn = document.getElementById('regenerate-edit-image-btn');
const removeBtn = document.getElementById('remove-edit-image-btn');
const editModal = document.getElementById('edit-modal');
const wordInput = document.getElementById('edit-word');

console.log('Elements check:');
console.log('- Generate button:', generateBtn);
console.log('- Regenerate button:', regenerateBtn);
console.log('- Remove button:', removeBtn);
console.log('- Edit modal:', editModal);
console.log('- Word input:', wordInput);

// Check if buttons have event listeners
if (generateBtn) {
    console.log('Generate button found!');
    console.log('- Disabled:', generateBtn.disabled);
    console.log('- Classes:', generateBtn.className);
    console.log('- Style display:', getComputedStyle(generateBtn).display);
    console.log('- Parent visibility:', getComputedStyle(generateBtn.parentElement).display);
    
    // Test clicking programmatically
    console.log('Testing programmatic click...');
    generateBtn.click();
    
    // Add a temporary event listener to test
    const testListener = () => {
        console.log('TEST: Generate button clicked!');
        alert('Generate button works!');
    };
    generateBtn.addEventListener('click', testListener);
    console.log('Added test event listener. Try clicking the button now.');
    
    // Remove test listener after 10 seconds
    setTimeout(() => {
        generateBtn.removeEventListener('click', testListener);
        console.log('Test event listener removed.');
    }, 10000);
} else {
    console.log('Generate button NOT found!');
    
    // Look for elements that might have similar IDs
    const allButtons = document.querySelectorAll('button');
    console.log('All buttons on page:', allButtons);
    
    const buttonsWithGenerate = Array.from(allButtons).filter(btn => 
        btn.id.includes('generate') || btn.textContent.includes('Generate')
    );
    console.log('Buttons with "generate" in ID or text:', buttonsWithGenerate);
}

// Check if edit modal is currently visible
if (editModal) {
    const isVisible = !editModal.classList.contains('hidden');
    console.log('Edit modal visible:', isVisible);
    
    if (!isVisible) {
        console.log('Edit modal is hidden. To test, you need to:');
        console.log('1. Add a flashcard first');
        console.log('2. Click the edit button on a flashcard');
        console.log('3. Then the edit modal will show and you can test the generate button');
        
        // Try to find and show the modal for testing
        console.log('Attempting to show edit modal for testing...');
        editModal.classList.remove('hidden');
        
        // Fill in test data if word input exists
        if (wordInput) {
            wordInput.value = 'test word';
            console.log('Added test word to input field');
        }
        
        console.log('Edit modal should now be visible. Try the generate button!');
    }
} else {
    console.log('Edit modal element not found!');
}

// Check app state
if (typeof state !== 'undefined') {
    console.log('App state:', state);
} else {
    console.log('App state not accessible from console');
}

console.log('=== END DEBUG SCRIPT ===');
console.log('Next steps:');
console.log('1. Check if the generate button appears in the console output');
console.log('2. If modal was hidden, it should now be visible - try clicking generate button');
console.log('3. If button still does not work, check browser developer tools console for errors');