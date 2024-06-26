// script.js
document.addEventListener("DOMContentLoaded", function() {
    // Bouton retour en haut de page
    const backToTopButton = document.querySelector(".back-to-top");
    
    window.addEventListener("scroll", function() {
        if (window.scrollY > 100) {
            backToTopButton.style.display = "block";
        } else {
            backToTopButton.style.display = "none";
        }
    });

    backToTopButton.addEventListener("click", function() {
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    });

    // Smooth scroll pour les liens de navigation
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            document.querySelector(this.getAttribute('href')).scrollIntoView({
                behavior: 'smooth'
            });
        });
    });
});
