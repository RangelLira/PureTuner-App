// Interações e animações da Landing Page
document.addEventListener('DOMContentLoaded', () => {
    
    // 1. Reveal Elements on Scroll
    const reveals = document.querySelectorAll('.reveal');

    const revealOnScroll = () => {
        const windowHeight = window.innerHeight;
        const elementVisible = 150;

        reveals.forEach((reveal) => {
            const elementTop = reveal.getBoundingClientRect().top;
            if (elementTop < windowHeight - elementVisible) {
                reveal.classList.add('active');
            }
        });
    };

    window.addEventListener('scroll', revealOnScroll);
    revealOnScroll(); // Trigger on load

    // 2. Mockup Interaction (Efeito "Geleia" da agulha)
    const needle = document.querySelector('.needle');
    const mockupBtn = document.querySelector('.btn-mockup');
    let isTuning = false;
    let tuningInterval;

    if(needle && mockupBtn) {
        mockupBtn.addEventListener('click', () => {
            isTuning = !isTuning;
            
            if (isTuning) {
                mockupBtn.textContent = 'Parar';
                mockupBtn.style.backgroundColor = '#E65C00';
                
                // Simula o movimento suave da agulha com posições aleatórias
                tuningInterval = setInterval(() => {
                    // Posição entre 10% e 90%
                    const randomPos = Math.floor(Math.random() * 80) + 10;
                    needle.style.left = `${randomPos}%`;
                }, 800);

            } else {
                mockupBtn.textContent = 'Iniciar';
                mockupBtn.style.backgroundColor = 'var(--primary-orange)';
                clearInterval(tuningInterval);
                needle.style.left = '50%'; // Volta pro centro
            }
        });
    }

    // 3. Smooth Scrolling para âncoras
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if(target) {
                target.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });
});
