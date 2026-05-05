document.addEventListener('DOMContentLoaded', function() {
    // Get all event containers
    const eventContainers = document.querySelectorAll('.event-container');
    const currentEventsContainer = document.querySelector('.current-events');
    const upcomingEventsContainer = document.querySelector('.upcoming-events');
    const pastEventsContainer = document.querySelector('.past-events');
    
    // Get current date
    const currentDate = new Date();
    
    eventContainers.forEach(function(eventContainer) {
        // Get start and end dates from data attributes
        const startDateStr = eventContainer.getAttribute('data-start-date');
        const endDateStr = eventContainer.getAttribute('data-end-date');
        
        // Convert to Date objects (parse as local time, treat end date as end-of-day)
        const [startY, startM, startD] = startDateStr.split('-').map(Number);
        const [endY, endM, endD] = endDateStr.split('-').map(Number);
        const startDate = new Date(startY, startM - 1, startD, 0, 0, 0, 0);
        const endDate = new Date(endY, endM - 1, endD, 23, 59, 59, 999);
        
        // Determine event status
        let eventStatus;
        
        if (currentDate >= startDate && currentDate <= endDate) {
            // Event is currently happening
            eventStatus = 'current';
        } else if (currentDate < startDate) {
            // Event hasn't started yet
            eventStatus = 'upcoming';
        } else {
            // Event has ended
            eventStatus = 'past';
        }
        
        // Move event to appropriate container
        switch(eventStatus) {
            case 'current':
                if (currentEventsContainer) {
                    currentEventsContainer.appendChild(eventContainer);
                }
                break;
            case 'upcoming':
                if (upcomingEventsContainer) {
                    upcomingEventsContainer.appendChild(eventContainer);
                }
                break;
            case 'past':
                if (pastEventsContainer) {
                    pastEventsContainer.appendChild(eventContainer);
                }
                break;
        }
    });
    
    // Hide empty event containers
    const eventContainersToCheck = [
        { container: currentEventsContainer, parent: document.querySelector('.current-events-container') },
        { container: upcomingEventsContainer, parent: document.querySelector('.upcoming-events-container') },
        { container: pastEventsContainer, parent: document.querySelector('.past-events-container') }
    ];
    
    eventContainersToCheck.forEach(function(item) {
        if (item.container && item.container.children.length === 0) {
            if (item.parent) {
                item.parent.style.display = 'none';
            }
        }
    });
}); 