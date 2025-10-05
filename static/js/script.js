// Main functionality
document.addEventListener('DOMContentLoaded', function() {
    initializeDashboard();
    
    // Close modal when clicking outside
    window.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
        }
    });
});

// Dashboard functionality
function initializeDashboard() {
    initializeListManagement();
    initializeCardManagement();
    initializeLabelManagement();
    initializeDragAndDrop();
}

// List management
function initializeListManagement() {
    const addListBtn = document.getElementById('add-list-btn');
    const addListTextBtn = document.getElementById('add-list-text-btn');
    const saveListBtn = document.getElementById('save-list-btn');
    const cancelListBtn = document.getElementById('cancel-list-btn');
    const newListName = document.getElementById('new-list-name');

    if (addListBtn) {
        addListBtn.addEventListener('click', showListForm);
    }
    if (addListTextBtn) {
        addListTextBtn.addEventListener('click', showListForm);
    }

    if (cancelListBtn) {
        cancelListBtn.addEventListener('click', hideListForm);
    }

    if (saveListBtn) {
        saveListBtn.addEventListener('click', createList);
    }

    if (newListName) {
        newListName.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                createList();
            }
        });
    }

    // Archive list buttons
    document.querySelectorAll('.archive-list-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const listId = this.getAttribute('data-list-id');
            archiveList(listId);
        });
    });
}

function showListForm() {
    const addListBtn = document.getElementById('add-list-text-btn');
    const addListForm = document.querySelector('.add-list-form');
    
    if (addListBtn && addListForm) {
        addListBtn.style.display = 'none';
        addListForm.style.display = 'flex';
        document.getElementById('new-list-name').focus();
    }
}

function hideListForm() {
    const addListBtn = document.getElementById('add-list-text-btn');
    const addListForm = document.querySelector('.add-list-form');
    
    if (addListBtn && addListForm) {
        addListBtn.style.display = 'block';
        addListForm.style.display = 'none';
        document.getElementById('new-list-name').value = '';
    }
}

function createList() {
    const listName = document.getElementById('new-list-name').value.trim();

    if (!listName) {
        alert('Please enter a list name');
        return;
    }

    fetch('/api/lists', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            name: listName
        })
    })
    .then(response => response.json())
    .then(data => {
        hideListForm();
        window.location.reload();
    })
    .catch(error => {
        console.error('Error creating list:', error);
        alert('Error creating list. Please try again.');
    });
}

function archiveList(listId) {
    if (!confirm('Are you sure you want to archive this list and all its cards?')) {
        return;
    }

    fetch(`/api/lists/${listId}/archive`, {
        method: 'POST'
    })
    .then(response => response.json())
    .then(data => {
        window.location.reload();
    })
    .catch(error => {
        console.error('Error archiving list:', error);
    });
}

// Card management
function initializeCardManagement() {
    // Add card buttons
    document.querySelectorAll('.add-card-btn, .add-card-text-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const listId = this.getAttribute('data-list-id');
            openCardModal(null, listId);
        });
    });

    // Edit card buttons
    document.querySelectorAll('.edit-card-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const cardId = this.getAttribute('data-card-id');
            openCardModal(cardId);
        });
    });

    // Archive card buttons
    document.querySelectorAll('.archive-card-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const cardId = this.getAttribute('data-card-id');
            archiveCard(cardId);
        });
    });

    // Card click handlers
    document.querySelectorAll('.card .card-content').forEach(cardContent => {
        cardContent.addEventListener('click', function() {
            const cardId = this.closest('.card').getAttribute('data-card-id');
            openCardModal(cardId);
        });
    });

    // Card form submission
    document.getElementById('card-form').addEventListener('submit', function(e) {
        e.preventDefault();
        saveCard();
    });
}

function openCardModal(cardId = null, listId = null) {
    const cardModal = document.getElementById('card-modal');
    const modalTitle = document.getElementById('card-modal-title');
    
    if (cardId) {
        // Edit existing card
        modalTitle.textContent = 'Edit Card';
        loadCardData(cardId);
        cardModal.setAttribute('data-card-id', cardId);
    } else {
        // Create new card
        modalTitle.textContent = 'Add Card';
        resetCardModal();
        cardModal.setAttribute('data-list-id', listId);
        cardModal.removeAttribute('data-card-id');
    }
    
    cardModal.style.display = 'flex';
    document.getElementById('card-title').focus();
}

function resetCardModal() {
    document.getElementById('card-form').reset();
    document.getElementById('card-id').value = '';
    // Uncheck all labels
    document.querySelectorAll('input[name="card-labels"]').forEach(checkbox => {
        checkbox.checked = false;
    });
}

function loadCardData(cardId) {
    const cardElement = document.querySelector(`.card[data-card-id="${cardId}"]`);
    if (cardElement) {
        const title = cardElement.querySelector('.card-content h4').textContent;
        const description = cardElement.querySelector('.card-content p')?.textContent || '';
        
        document.getElementById('card-title').value = title;
        document.getElementById('card-description').value = description;
        document.getElementById('card-id').value = cardId;
        
        // Load additional data would go here
        // For now, we'll just load from the DOM
    }
}

function saveCard() {
    const cardId = document.getElementById('card-id').value;
    const listId = document.getElementById('card-modal').getAttribute('data-list-id');
    const title = document.getElementById('card-title').value.trim();
    const description = document.getElementById('card-description').value;
    const assigneeId = document.getElementById('card-assignee').value;
    const dueDate = document.getElementById('card-due-date').value;
    
    // Get selected labels
    const selectedLabels = Array.from(document.querySelectorAll('input[name="card-labels"]:checked'))
        .map(checkbox => checkbox.value);

    if (!title) {
        alert('Please enter a card title');
        return;
    }

    const cardData = {
        title: title,
        description: description,
        assignee_id: assigneeId || null,
        due_date: dueDate || null,
        label_ids: selectedLabels
    };

    let url, method;
    
    if (cardId) {
        // Update existing card
        url = `/api/cards/${cardId}`;
        method = 'PUT';
        // Remove label_ids for update as we have separate endpoints
        delete cardData.label_ids;
    } else {
        // Create new card
        url = `/api/lists/${listId}/cards`;
        method = 'POST';
    }

    fetch(url, {
        method: method,
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(cardData)
    })
    .then(response => response.json())
    .then(data => {
        document.getElementById('card-modal').style.display = 'none';
        document.getElementById('card-form').reset();
        window.location.reload();
    })
    .catch(error => {
        console.error('Error saving card:', error);
        alert('Error saving card. Please try again.');
    });
}

function archiveCard(cardId) {
    if (!confirm('Are you sure you want to archive this card?')) return;

    fetch(`/api/cards/${cardId}/archive`, {
        method: 'POST'
    })
    .then(response => response.json())
    .then(data => {
        window.location.reload();
    })
    .catch(error => {
        console.error('Error archiving card:', error);
    });
}

// Label management
function initializeLabelManagement() {
    const createLabelBtn = document.getElementById('create-label-btn');
    const labelModal = document.getElementById('label-modal');
    const cancelLabel = document.getElementById('cancel-label');
    const labelForm = document.getElementById('label-form');

    if (createLabelBtn) {
        createLabelBtn.addEventListener('click', function() {
            labelModal.style.display = 'flex';
        });
    }

    if (cancelLabel) {
        cancelLabel.addEventListener('click', function() {
            labelModal.style.display = 'none';
        });
    }

    if (labelForm) {
        labelForm.addEventListener('submit', function(e) {
            e.preventDefault();
            createLabel();
        });
    }
}

function createLabel() {
    const labelName = document.getElementById('label-name').value.trim();
    const labelColor = document.getElementById('label-color').value;
    const boardId = document.getElementById('current-board-id').value;

    if (!labelName) {
        alert('Please enter a label name');
        return;
    }

    fetch(`/api/boards/${boardId}/labels`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            name: labelName,
            color: labelColor
        })
    })
    .then(response => response.json())
    .then(data => {
        document.getElementById('label-modal').style.display = 'none';
        document.getElementById('label-form').reset();
        window.location.reload();
    })
    .catch(error => {
        console.error('Error creating label:', error);
        alert('Error creating label. Please try again.');
    });
}

// Drag and drop functionality
function initializeDragAndDrop() {
    let draggedCard = null;

    document.addEventListener('dragstart', function(e) {
        if (e.target.classList.contains('card')) {
            draggedCard = e.target;
            setTimeout(() => {
                e.target.classList.add('dragging');
            }, 0);
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', e.target.dataset.cardId);
        }
    });

    document.addEventListener('dragend', function(e) {
        if (e.target.classList.contains('card')) {
            e.target.classList.remove('dragging');
            draggedCard = null;
        }
    });

    document.addEventListener('dragover', function(e) {
        e.preventDefault();
        const cardsContainer = e.target.closest('.cards-container');
        if (cardsContainer) {
            e.dataTransfer.dropEffect = 'move';
        }
    });

    document.addEventListener('drop', function(e) {
        e.preventDefault();
        const cardsContainer = e.target.closest('.cards-container');
        
        if (cardsContainer && draggedCard) {
            const newListId = cardsContainer.dataset.listId;
            const cardId = draggedCard.dataset.cardId;
            
            fetch(`/api/cards/${cardId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    list_id: newListId
                })
            })
            .then(response => response.json())
            .then(data => {
                // Move card in DOM
                cardsContainer.appendChild(draggedCard);
                draggedCard.dataset.listId = newListId;
            })
            .catch(error => {
                console.error('Error moving card:', error);
                window.location.reload();
            });
        }
    });
}