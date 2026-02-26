/**
 * Avatar 3D Effect Scripts
 * Creates interactive 3D parallax effects for avatar image based on mouse movement
 */

document.addEventListener('DOMContentLoaded', function() {
  // Get the avatar container element
  const avatarContainer = document.querySelector('.avatar-3d-container');
  const avatarCard = document.querySelector('.avatar-3d-card');
  
  if (!avatarContainer || !avatarCard) return;
  
  // Add the floating animation class
  avatarContainer.classList.add('is-animated');
  
  // Handle mouse movement parallax effect
  avatarContainer.addEventListener('mousemove', function(e) {
    // Get mouse position within the container
    const rect = avatarContainer.getBoundingClientRect();
    const x = e.clientX - rect.left; // x position within the element
    const y = e.clientY - rect.top;  // y position within the element
    
    // Calculate rotation values based on mouse position
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    // Calculate rotation angles - maximum 10 degrees rotation
    const rotateY = ((x - centerX) / centerX) * 10;
    const rotateX = ((centerY - y) / centerY) * 10;
    
    // Apply the transformation
    avatarCard.style.transform = `rotateY(${rotateY}deg) rotateX(${rotateX}deg)`;
  });
  
  // Reset on mouse leave
  avatarContainer.addEventListener('mouseleave', function() {
    avatarCard.style.transform = 'rotateY(0deg) rotateX(0deg)';
    
    // Re-add the floating animation after a delay
    setTimeout(() => {
      avatarContainer.classList.add('is-animated');
    }, 300);
  });
  
  // Remove floating animation when interacting with mouse
  avatarContainer.addEventListener('mouseenter', function() {
    avatarContainer.classList.remove('is-animated');
  });
});
