const Input = document.getElementById('searchInput');
const bonusIcon = document.getElementById('leftIcon');

function clearSearch() {
    Input.value = '';
    Input.focus();
}

Input.addEventListener('focus', () => {
    Input.style.width = '400px'; 
    Input.style.transition = 'width 0.3s ease';
    bonusIcon.style.display = 'flex'; 
});
  
Input.addEventListener('blur', () => {
    Input.style.width = '340px'; 
    bonusIcon.style.display = 'none';
});

