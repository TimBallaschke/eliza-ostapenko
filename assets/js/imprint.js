const imprintButton = document.querySelector('.imprint-button');
const closeImprintButton = document.querySelector('.close-imprint-button');

document.addEventListener('DOMContentLoaded', () => {
    imprintButton.addEventListener('click', () => {
        if (!document.body.classList.contains('imprint-opened-2')) {
            document.body.classList.add('imprint-opened-1');
            
            setTimeout(() => {
                const aboutScrollContainer = document.querySelector('.about-scroll-container');
                aboutScrollContainer.scrollTop = 0;
                document.body.classList.remove('imprint-opened-1');
                document.body.classList.add('imprint-opened-2');
            }, 250);
        }
    });

    closeImprintButton.addEventListener('click', () => {
        if(document.body.classList.contains('imprint-opened-2')) {

            document.body.classList.remove('imprint-opened-2');
            document.body.classList.add('imprint-opened-1');

            setTimeout(() => {
                const aboutScrollContainer = document.querySelector('.about-scroll-container');
                aboutScrollContainer.scrollTop = 0;
                document.body.classList.remove('imprint-opened-1');
            }, 250);
        }
    });
});
