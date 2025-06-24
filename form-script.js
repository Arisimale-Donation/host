// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyDhHHkFtPFKnajwcFGZO-dLYbcTGSH77Kk",
  authDomain: "temple-c4a9e.firebaseapp.com",
  databaseURL: "https://temple-c4a9e-default-rtdb.firebaseio.com",
  projectId: "temple-c4a9e",
  storageBucket: "temple-c4a9e.firebasestorage.app",
  messagingSenderId: "829243178884",
  appId: "1:829243178884:web:72d3efd87c284507a0a7d1",
  measurementId: "G-X7ZH02Z500"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// Global Variables
let currentStep = 1;
let selectedOption = '';
let selectedSubOption = '';
let selectedDate = '';
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();
let blockedDates = [];
let additionalContactCount = 0;

// Form Data Object
const formData = {
    option: '',
    subOption: '',
    date: '',
    fullName: '',
    address: '',
    contacts: [],
    timePreference: ''
};

// DOM Elements
const steps = {
    1: document.getElementById('step1'),
    2: document.getElementById('step2'),
    3: document.getElementById('step3'),
    4: document.getElementById('step4')
};

// Initialize App
document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
    loadBlockedDates();
    renderCalendar();
});

// Event Listeners
function initializeEventListeners() {
    // Step 1 - Option Selection
    document.querySelectorAll('.option-card').forEach(card => {
        card.addEventListener('click', handleOptionSelection);
    });

    document.querySelectorAll('.sub-option-card').forEach(card => {
        card.addEventListener('click', handleSubOptionSelection);
    });

    // Navigation Buttons
    document.getElementById('step1Next').addEventListener('click', () => goToStep(2));
    document.getElementById('step2Back').addEventListener('click', () => goToStep(1));
    document.getElementById('step2Next').addEventListener('click', () => goToStep(3));
    document.getElementById('step3Back').addEventListener('click', () => goToStep(2));
    document.getElementById('step3Next').addEventListener('click', () => goToStep(4));
    document.getElementById('step4Back').addEventListener('click', () => goToStep(3));

    // Calendar Navigation
    document.getElementById('prevMonth').addEventListener('click', () => {
        currentMonth--;
        if (currentMonth < 0) {
            currentMonth = 11;
            currentYear--;
        }
        renderCalendar();
    });

    document.getElementById('nextMonth').addEventListener('click', () => {
        currentMonth++;
        if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
        }
        renderCalendar();
    });

    // Form Validation
    document.getElementById('fullName').addEventListener('input', validateStep3);
    document.getElementById('address').addEventListener('input', validateStep3);
    document.getElementById('contact1').addEventListener('input', validateStep3);

    // Add Contact Button
    document.getElementById('addContact').addEventListener('click', addContactField);

    // Submit Form
    document.getElementById('submitForm').addEventListener('click', handleFormSubmission);
}

// Step 1 Functions
function handleOptionSelection(e) {
    const option = e.currentTarget.dataset.option;
    selectedOption = option;
    formData.option = option;

    // Remove previous selections
    document.querySelectorAll('.option-card').forEach(card => {
        card.classList.remove('ring-4', 'ring-white', 'ring-opacity-50');
    });

    // Add selection styling
    e.currentTarget.classList.add('ring-4', 'ring-white', 'ring-opacity-50');

    // Show sub-options
    document.getElementById('subOptions').classList.remove('hidden');
    document.getElementById('subOptions').classList.add('animate-fadeInUp');

    // Reset sub-option selection
    selectedSubOption = '';
    document.querySelectorAll('.sub-option-card').forEach(card => {
        card.classList.remove('ring-4', 'ring-white', 'ring-opacity-50');
    });

    // Show SweetAlert notification for option selection
    Swal.fire({
        icon: 'success',
        title: 'Donation Option Selected',
        text: `You have selected ${option} donation`,
        timer: 2000,
        showConfirmButton: false,
        position: 'top-end',
        toast: true
    });

    validateStep1();
}

function handleSubOptionSelection(e) {
    const subOption = e.currentTarget.dataset.sub;
    selectedSubOption = subOption;
    formData.subOption = subOption;

    // Remove previous selections
    document.querySelectorAll('.sub-option-card').forEach(card => {
        card.classList.remove('ring-4', 'ring-white', 'ring-opacity-50');
    });

    // Add selection styling
    e.currentTarget.classList.add('ring-4', 'ring-white', 'ring-opacity-50');

    // Show/hide time preference based on sub-option selection
    const timePreferenceDiv = document.querySelector('#timePreference').closest('.group');
    if (subOption === 'food_given') {
        timePreferenceDiv.style.display = 'block';
    } else {
        timePreferenceDiv.style.display = 'none';
        document.getElementById('timePreference').value = ''; // Reset the value when hidden
    }

    // Show SweetAlert notification for sub-option selection
    Swal.fire({
        icon: 'success',
        title: 'Frequency Selected',
        text: `You have selected ${subOption} payment frequency`,
        timer: 2000,
        showConfirmButton: false,
        position: 'top-end',
        toast: true
    });

    validateStep1();
}

function validateStep1() {
    const nextBtn = document.getElementById('step1Next');
    if (selectedOption && selectedSubOption) {
        nextBtn.disabled = false;
        nextBtn.classList.remove('opacity-50', 'cursor-not-allowed');
    } else {
        nextBtn.disabled = true;
        nextBtn.classList.add('opacity-50', 'cursor-not-allowed');
    }
}

// Step 2 Functions - Calendar
function renderCalendar() {
    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    document.getElementById('monthYear').textContent = `${monthNames[currentMonth]} ${currentYear}`;

    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const calendarDays = document.getElementById('calendarDays');
    calendarDays.innerHTML = '';

    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
        const emptyDay = document.createElement('div');
        calendarDays.appendChild(emptyDay);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
        const dayElement = document.createElement('div');
        const currentDate = new Date(currentYear, currentMonth, day);
        currentDate.setHours(0, 0, 0, 0);
        const dateString = formatDate(currentDate);

        dayElement.className = 'calendar-day w-10 h-10 flex items-center justify-center rounded-lg cursor-pointer hover:bg-blue-100 transition-colors';
        dayElement.textContent = day;

        // Check if date is in the past
        if (currentDate < today) {
            dayElement.classList.add('text-gray-400', 'cursor-not-allowed', 'bg-gray-100');
            dayElement.classList.remove('cursor-pointer', 'hover:bg-blue-100');
        }
        // Check if date is blocked
        else if (isDateBlocked(dateString)) {
            dayElement.classList.add('bg-red-100', 'text-red-600', 'cursor-not-allowed');
            dayElement.classList.remove('cursor-pointer', 'hover:bg-blue-100');
            dayElement.title = 'This date is not available';
        }
        // Check if date is selected
        else if (selectedDate === dateString) {
            dayElement.classList.add('bg-blue-500', 'text-white');
            dayElement.classList.remove('hover:bg-blue-100');
        }
        // Available date
        else {
            dayElement.addEventListener('click', () => selectDate(dateString, dayElement));
        }

        calendarDays.appendChild(dayElement);
    }
}

function selectDate(dateString, element) {
    // Remove previous selection
    document.querySelectorAll('.selected-date').forEach(el => {
        el.classList.remove('selected-date');
        el.classList.add('hover:bg-blue-100');
    });

    // Add new selection
    element.classList.add('selected-date');
    element.classList.remove('hover:bg-blue-100');

    selectedDate = dateString;
    formData.date = dateString;

    // Update time preference options based on existing bookings for this date
    updateTimePreferenceOptions(dateString);

    // Show SweetAlert notification for date selection
    Swal.fire({
        icon: 'success',
        title: 'Date Selected',
        text: `You have selected ${dateString}`,
        timer: 2000,
        showConfirmButton: false,
        position: 'top-end',
        toast: true
    });

    // Enable next button
    const nextBtn = document.getElementById('step2Next');
    nextBtn.disabled = false;
    nextBtn.classList.remove('opacity-50', 'cursor-not-allowed');
}

// NEW FUNCTION: Update time preference options based on existing bookings
function updateTimePreferenceOptions(dateString) {
    if (selectedSubOption !== 'food_given') {
        return; // Only apply to food_given
    }

    const timePreferenceSelect = document.getElementById('timePreference');
    const existingBookings = getExistingBookingsForDate(dateString);
    
    // Reset all options to enabled
    const options = timePreferenceSelect.querySelectorAll('option');
    options.forEach(option => {
        option.disabled = false;
        option.style.display = 'block';
    });

    // Check what's already booked for this date
    const bookedMorning = existingBookings.some(booking => 
        booking.time_preference === 'morning' || booking.time_preference === 'morning_afternoon'
    );
    const bookedAfternoon = existingBookings.some(booking => 
        booking.time_preference === 'afternoon' || booking.time_preference === 'morning_afternoon'
    );

    // Disable options based on existing bookings
    options.forEach(option => {
        if (option.value === 'morning' && bookedMorning) {
            option.disabled = true;
            option.style.display = 'none';
        }
        if (option.value === 'afternoon' && bookedAfternoon) {
            option.disabled = true;
            option.style.display = 'none';
        }
        if (option.value === 'morning_afternoon' && (bookedMorning || bookedAfternoon)) {
            option.disabled = true;
            option.style.display = 'none';
        }
    });

    // Reset the selected value if it's now disabled
    if (timePreferenceSelect.value && timePreferenceSelect.querySelector(`option[value="${timePreferenceSelect.value}"]`).disabled) {
        timePreferenceSelect.value = '';
    }
}

// NEW FUNCTION: Get existing bookings for a specific date
function getExistingBookingsForDate(dateString) {
    if (!blockedDates || !blockedDates.length) {
        return [];
    }

    const current = parseDate(dateString);
    if (!current) return [];

    return blockedDates.filter(blockedDate => {
        if (!blockedDate || !blockedDate.selected_date || !blockedDate.option_type || !blockedDate.sub_option) {
            return false;
        }

        // Only check dates with matching sub_option
        if (blockedDate.sub_option !== 'food_given') {
            return false;
        }

        const blocked = parseDate(blockedDate.selected_date);
        if (!blocked) return false;

        // Check if this blocked date affects the current date
        switch (blockedDate.option_type) {
            case 'yearly':
                // Same month and day for all years
                return blocked.getMonth() === current.getMonth() && 
                       blocked.getDate() === current.getDate();
                       
            case 'monthly':
                // Same day of every month, but only for dates >= the original blocked date
                const blockedYearMonth = blocked.getFullYear() * 12 + blocked.getMonth();
                const currentYearMonth = current.getFullYear() * 12 + current.getMonth();
                
                return blocked.getDate() === current.getDate() && 
                       currentYearMonth >= blockedYearMonth;
                       
            case 'special':
                // Exact date match only
                return blocked.getFullYear() === current.getFullYear() &&
                       blocked.getMonth() === current.getMonth() &&
                       blocked.getDate() === current.getDate();
                       
            default:
                return false;
        }
    });
}

// UPDATED FUNCTION: Modified isDateBlocked to handle time preferences
function isDateBlocked(dateString) {
    if (!blockedDates || !blockedDates.length || selectedSubOption === 'money_given') {
        return false;
    }

    const current = parseDate(dateString);
    if (!current) return false;
    
    // For food_given, check if ALL time slots are blocked
    if (selectedSubOption === 'food_given') {
        const existingBookings = getExistingBookingsForDate(dateString);
        
        // Check if morning_afternoon is booked (fully blocks the date)
        const hasFullDayBooking = existingBookings.some(booking => 
            booking.time_preference === 'morning_afternoon'
        );
        
        if (hasFullDayBooking) {
            return true; // Date is fully blocked
        }

        // Check if both morning and afternoon are separately booked
        const bookedMorning = existingBookings.some(booking => 
            booking.time_preference === 'morning'
        );
        const bookedAfternoon = existingBookings.some(booking => 
            booking.time_preference === 'afternoon'
        );

        // Date is blocked only if both morning and afternoon are taken
        return bookedMorning && bookedAfternoon;
    }

    // For other sub_options, use the original logic
    return blockedDates.some(blockedDate => {
        if (!blockedDate || !blockedDate.selected_date || !blockedDate.option_type || !blockedDate.sub_option) {
            return false;
        }
        
        // Only check dates with matching sub_option
        if (blockedDate.sub_option !== selectedSubOption) {
            return false;
        }
        
        const blocked = parseDate(blockedDate.selected_date);
        if (!blocked) return false;
        
        // Handle different blocking types based on the blocked date's option_type
        switch (blockedDate.option_type) {
            case 'yearly':
                // Block same month and day for all years
                return blocked.getMonth() === current.getMonth() && 
                       blocked.getDate() === current.getDate();
                       
            case 'monthly':
                // Block same day of every month, but only for dates >= the original blocked date
                const blockedYearMonth = blocked.getFullYear() * 12 + blocked.getMonth();
                const currentYearMonth = current.getFullYear() * 12 + current.getMonth();
                
                return blocked.getDate() === current.getDate() && 
                       currentYearMonth >= blockedYearMonth;
                       
            case 'special':
                // Block exact date match only
                return blocked.getFullYear() === current.getFullYear() &&
                       blocked.getMonth() === current.getMonth() &&
                       blocked.getDate() === current.getDate();
                       
            default:
                return false;
        }
    });
}

// Helper function to get all blocked dates for calendar display
function getBlockedDatesForCalendar(year, month) {
    if (!blockedDates || !blockedDates.length) {
        return [];
    }
    
    const blockedDatesInMonth = [];
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    // Check each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
        const dateString = formatDate(new Date(year, month, day));
        if (isDateBlocked(dateString)) {
            blockedDatesInMonth.push(day);
        }
    }
    
    return blockedDatesInMonth;
}

// Enhanced parseDate with better error handling
function parseDate(dateString) {
    if (!dateString || typeof dateString !== 'string') return null;
    
    try {
        const [year, month, day] = dateString.split('-').map(num => parseInt(num, 10));
        
        // Validate the parsed values
        if (isNaN(year) || isNaN(month) || isNaN(day) || 
            year < 1900 || year > 2100 || 
            month < 1 || month > 12 || 
            day < 1 || day > 31) {
            return null;
        }
        
        const date = new Date(year, month - 1, day);
        date.setHours(0, 0, 0, 0);
        
        // Verify the date is valid (handles cases like Feb 30)
        if (date.getFullYear() !== year || 
            date.getMonth() !== month - 1 || 
            date.getDate() !== day) {
            return null;
        }
        
        return date;
    } catch (error) {
        console.error('Error parsing date:', dateString, error);
        return null;
    }
}

// Enhanced formatDate function
function formatDate(date) {
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
        return null;
    }
    
    try {
        const offset = date.getTimezoneOffset();
        const adjustedDate = new Date(date.getTime() - (offset * 60 * 1000));
        return adjustedDate.toISOString().split('T')[0];
    } catch (error) {
        console.error('Error formatting date:', date, error);
        return null;
    }
}

// Step 3 Functions
function validateStep3() {
    const fullName = document.getElementById('fullName').value.trim();
    const address = document.getElementById('address').value.trim();
    const contact1 = document.getElementById('contact1').value.trim();
    const timePreference = document.getElementById('timePreference');
    
    const nextBtn = document.getElementById('step3Next');
    
    if (fullName && address && contact1) {
        if (selectedSubOption === 'food_given' && !timePreference.value) {
            nextBtn.disabled = true;
            nextBtn.classList.add('opacity-50', 'cursor-not-allowed');
        } else {
            nextBtn.disabled = false;
            nextBtn.classList.remove('opacity-50', 'cursor-not-allowed');
        }
    } else {
        nextBtn.disabled = true;
        nextBtn.classList.add('opacity-50', 'cursor-not-allowed');
    }
}

function addContactField() {
    if (additionalContactCount >= 2) {
        showToast('Maximum 3 contact numbers allowed', 'error');
        return;
    }

    additionalContactCount++;
    const contactContainer = document.getElementById('additionalContacts');
    
    const contactDiv = document.createElement('div');
    contactDiv.className = 'floating-label';
    contactDiv.innerHTML = `
        <input type="tel" id="contact${additionalContactCount + 1}" placeholder=" " class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all">
        <label for="contact${additionalContactCount + 1}">Additional Contact Number ${additionalContactCount}</label>
        <button type="button" class="absolute right-3 top-3 text-red-500 hover:text-red-700" onclick="removeContactField(this)">
            <span class="text-lg">×</span>
        </button>
    `;
    
    contactContainer.appendChild(contactDiv);
    
    if (additionalContactCount >= 2) {
        document.getElementById('addContact').style.display = 'none';
    }
}

function removeContactField(button) {
    const contactDiv = button.parentElement;
    contactDiv.remove();
    additionalContactCount--;
    
    if (additionalContactCount < 2) {
        document.getElementById('addContact').style.display = 'flex';
    }
}

// Step Navigation
function goToStep(stepNumber) {
    // Hide current step
    steps[currentStep].classList.add('hidden');
    
    // Show new step
    steps[stepNumber].classList.remove('hidden');
    steps[stepNumber].classList.add('animate-fadeInUp');
    
    // Update progress
    updateProgress(stepNumber);
    
    // Update current step
    currentStep = stepNumber;
    
    // Handle specific step logic
    if (stepNumber === 4) {
        populateReviewStep();
    }
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updateProgress(step) {
    const progressPercent = (step / 4) * 100;
    document.getElementById('progressBar').style.width = `${progressPercent}%`;
    document.getElementById('progressPercent').textContent = progressPercent;
    document.getElementById('currentStepNum').textContent = step;
}

// Step 4 - Review Functions
function populateReviewStep() {
    // Update form data
    formData.fullName = document.getElementById('fullName').value;
    formData.address = document.getElementById('address').value;
    formData.contacts = [document.getElementById('contact1').value];
    formData.timePreference = formData.subOption === 'food_given' ? document.getElementById('timePreference').value : '';
    
    // Add additional contacts
    for (let i = 2; i <= additionalContactCount + 1; i++) {
        const contactInput = document.getElementById(`contact${i}`);
        if (contactInput && contactInput.value.trim()) {
            formData.contacts.push(contactInput.value.trim());
        }
    }
    
    // Populate review fields
    document.getElementById('reviewOption').textContent = capitalizeFirst(formData.option);
    document.getElementById('reviewSubOption').textContent = capitalizeFirst(formData.subOption.replace('_', ' '));
    document.getElementById('reviewDate').textContent = formatDateForDisplay(formData.date);
    document.getElementById('reviewName').textContent = formData.fullName;
    document.getElementById('reviewAddress').textContent = formData.address;
    
    // Add time preference to review if food donation
    if (formData.subOption === 'food_given' && document.getElementById('timePreference').value) {
        const timePreference = document.getElementById('timePreference').value;
        document.getElementById('reviewAddress').insertAdjacentHTML('afterend', 
            `<p class="text-gray-700 mb-1">Time Preference: ${capitalizeFirst(timePreference)}</p>`);
    }
    
    // Populate contacts
    const contactsContainer = document.getElementById('reviewContacts');
    contactsContainer.innerHTML = '';
    formData.contacts.forEach((contact, index) => {
        const contactP = document.createElement('p');
        contactP.className = 'text-gray-700';
        contactP.textContent = `Contact ${index + 1}: ${contact}`;
        contactsContainer.appendChild(contactP);
    });
    
    // Show bank details if මූල්‍යමය ආධාර
    const bankDetails = document.getElementById('bankDetails');
    if (formData.subOption === 'money_given') {
        bankDetails.classList.remove('hidden');
    } else {
        bankDetails.classList.add('hidden');
    }
}

// Firebase Functions
async function loadBlockedDates() {
    try {
        // Initial load of blocked dates
        const snapshot = await database.ref('blocked_dates').once('value');
        const data = snapshot.val();
        blockedDates = data ? Object.values(data) : [];
        
        // Listen for real-time updates to blocked dates
        database.ref('blocked_dates').on('value', (snapshot) => {
            const data = snapshot.val();
            blockedDates = data ? Object.values(data) : [];
            renderCalendar(); // Re-render calendar when blocked dates change
        });

        renderCalendar(); // Initial render with blocked dates
    } catch (error) {
        console.error('Error loading blocked dates:', error);
        showToast('Error loading calendar data. Please refresh the page.', 'error');
        blockedDates = [];
        renderCalendar();
    }
}

// UPDATED FUNCTION: Modified saveFormSubmission to include time_preference
async function saveFormSubmission() {
    try {
        const submissionId = database.ref().child('form_submissions').push().key;
        const timestamp = firebase.database.ServerValue.TIMESTAMP;
        
        const submissionData = {
            option_type: formData.option,
            sub_option: formData.subOption,
            selected_date: formData.date,
            full_name: formData.fullName,
            address: formData.address,
            time_preference: formData.subOption === 'food_given' ? document.getElementById('timePreference').value : '',
            contact1: formData.contacts[0] || '',
            contact2: formData.contacts[1] || '',
            contact3: formData.contacts[2] || '',
            submission_time: timestamp
        };
        
        await database.ref(`form_submissions/${submissionId}`).set(submissionData);
        
        // Add to blocked dates if food_given
        if (formData.subOption === 'food_given') {
            const blockedDateId = database.ref().child('blocked_dates').push().key;
            const blockedDateData = {
                option_type: formData.option,
                sub_option: formData.subOption,
                selected_date: formData.date,
                time_preference: document.getElementById('timePreference').value, // NEW: Include time preference
                submission_id: submissionId,
                created_at: timestamp
            };
            
            await database.ref(`blocked_dates/${blockedDateId}`).set(blockedDateData);
        }
        
        return true;
    } catch (error) {
        console.error('Error saving form submission:', error);
        throw error;
    }
}

async function handleFormSubmission() {
    try {
        // Show loading state
        const submitBtn = document.getElementById('submitForm');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Submitting...';
        submitBtn.disabled = true;
        
        // Save to Firebase
        await saveFormSubmission();
        
        // Show success message
        Swal.fire({
            icon: 'success',
            title: 'Form Submitted Successfully!',
            text: 'Your donation request has been submitted. We will contact you soon.',
            confirmButtonText: 'OK',
            confirmButtonColor: '#3b82f6'
        }).then(() => {
            // Reset form or redirect
            window.location.reload();
        });
        
    } catch (error) {
        console.error('Form submission error:', error);
        
        // Restore button state
        const submitBtn = document.getElementById('submitForm');
        submitBtn.textContent = 'Submit Form';
        submitBtn.disabled = false;
        
        // Show error message
        Swal.fire({
            icon: 'error',
            title: 'Submission Failed',
            text: 'There was an error submitting your form. Please try again.',
            confirmButtonText: 'OK',
            confirmButtonColor: '#ef4444'
        });
    }
}

// Utility Functions
function capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function formatDateForDisplay(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    // Show toast
    setTimeout(() => {
        toast.classList.add('show');
    }, 100);
    
    // Hide toast
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 3000);
}

