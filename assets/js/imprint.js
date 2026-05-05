const imprintButton = document.querySelector('.imprint-button');
const closeImprintButton = document.querySelector('.close-imprint-button');

function pushImprintUrl() {
    const currentPath = window.location.pathname;
    if (currentPath.endsWith('imprint')) return;
    const basePath = currentPath.replace(/\/[^\/]*$/, '');
    const newPath = basePath + 'imprint';
    window.history.pushState({}, '', newPath);
}

function pushAboutUrlFromImprint() {
    const currentPath = window.location.pathname;
    if (currentPath.endsWith('imprint')) {
        const newPath = currentPath.replace(/imprint$/, 'about');
        window.history.pushState({}, '', newPath);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    imprintButton.addEventListener('click', () => {
        if (!document.body.classList.contains('imprint-opened-2')) {
            document.body.classList.add('imprint-opened-1');

            pushImprintUrl();

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

            pushAboutUrlFromImprint();

            setTimeout(() => {
                const aboutScrollContainer = document.querySelector('.about-scroll-container');
                aboutScrollContainer.scrollTop = 0;
                document.body.classList.remove('imprint-opened-1');
            }, 250);
        }
    });
});
