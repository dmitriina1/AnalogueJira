// Main functionality
document.addEventListener('DOMContentLoaded', function() {
    initializeDashboardFunctionality();
    initializeDragAndDrop();
    
    // Close modal when clicking outside
    window.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
        }
    });
});

function initializeDashboardFunctionality() {
    // List creation
    const addListBtn = document.getElementById('add-list-btn');
    const listModal = document.getElementById('list-modal');
    const cancelList = document.getElementById('cancel-list');
    const listForm = document.getElementById('list-form');
    const listNameInput = document.getElementById('list-name');
    
    if (addListBtn) {
        addListBtn.addEventListener('click', function() {
            // Очищаем поле названия списка
            listNameInput.value = '';
            listModal.style.display = 'flex';
            listNameInput.focus();
        });
    }
    
    if (cancelList) {
        cancelList.addEventListener('click', function() {
            listModal.style.display = 'none';
            listNameInput.value = '';
        });
    }
    
    if (listForm) {
        listForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const listName = listNameInput.value.trim();
            if (listName) {
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
                    listNameInput.value = '';
                    listModal.style.display = 'none';
                    location.reload();
                })
                .catch(error => {
                    console.error('Error creating list:', error);
                });
            }
        });
    }
    
    // Card creation
    const addCardBtns = document.querySelectorAll('.add-card-btn, .add-card-text-btn');
    const cardModal = document.getElementById('card-modal');
    const cancelCard = document.getElementById('cancel-card');
    const cardForm = document.getElementById('card-form');
    const cardListId = document.getElementById('card-list-id');
    const cardTitleInput = document.getElementById('card-title');
    const cardDescriptionInput = document.getElementById('card-description');
    
    addCardBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const listId = this.getAttribute('data-list-id');
            cardListId.value = listId;
            
            // Очищаем поля формы
            cardTitleInput.value = '';
            cardDescriptionInput.value = '';
            
            cardModal.style.display = 'flex';
            cardTitleInput.focus();
        });
    });
    
    if (cancelCard) {
        cancelCard.addEventListener('click', function() {
            cardModal.style.display = 'none';
            cardTitleInput.value = '';
            cardDescriptionInput.value = '';
        });
    }
    
    if (cardForm) {
        cardForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const cardTitle = cardTitleInput.value.trim();
            const cardDescription = cardDescriptionInput.value;
            const listId = cardListId.value;
            
            if (cardTitle) {
                fetch(`/api/lists/${listId}/cards`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        title: cardTitle,
                        description: cardDescription
                    })
                })
                .then(response => response.json())
                .then(data => {
                    cardTitleInput.value = '';
                    cardDescriptionInput.value = '';
                    cardModal.style.display = 'none';
                    location.reload();
                })
                .catch(error => {
                    console.error('Error creating card:', error);
                });
            }
        });
    }
    
    // Edit card
    const editCardBtns = document.querySelectorAll('.edit-card-btn');
    const editCardModal = document.getElementById('edit-card-modal');
    const cancelEditCard = document.getElementById('cancel-edit-card');
    const editCardForm = document.getElementById('edit-card-form');
    const editCardId = document.getElementById('edit-card-id');
    const editCardTitleInput = document.getElementById('edit-card-title');
    const editCardDescriptionInput = document.getElementById('edit-card-description');
    
    editCardBtns.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const cardId = this.getAttribute('data-card-id');
            const card = document.querySelector(`.card[data-card-id="${cardId}"]`);
            const cardTitle = card.querySelector('.card-content h4').textContent;
            const cardDescription = card.querySelector('.card-content p') ? card.querySelector('.card-content p').textContent : '';
            
            editCardTitleInput.value = cardTitle;
            editCardDescriptionInput.value = cardDescription;
            editCardId.value = cardId;
            
            editCardModal.style.display = 'flex';
            editCardTitleInput.focus();
        });
    });
    
    if (cancelEditCard) {
        cancelEditCard.addEventListener('click', function() {
            editCardModal.style.display = 'none';
            editCardTitleInput.value = '';
            editCardDescriptionInput.value = '';
        });
    }
    
    if (editCardForm) {
        editCardForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const cardId = editCardId.value;
            const cardTitle = editCardTitleInput.value.trim();
            const cardDescription = editCardDescriptionInput.value;
            
            if (cardTitle) {
                fetch(`/api/cards/${cardId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        title: cardTitle,
                        description: cardDescription
                    })
                })
                .then(response => response.json())
                .then(data => {
                    editCardTitleInput.value = '';
                    editCardDescriptionInput.value = '';
                    editCardModal.style.display = 'none';
                    location.reload();
                })
                .catch(error => {
                    console.error('Error updating card:', error);
                });
            }
        });
    }
    
    // Delete card
    const deleteCardBtns = document.querySelectorAll('.delete-card-btn');
    deleteCardBtns.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const cardId = this.getAttribute('data-card-id');
            
            if (confirm('Are you sure you want to delete this card?')) {
                fetch(`/api/cards/${cardId}`, {
                    method: 'DELETE'
                })
                .then(response => response.json())
                .then(data => {
                    location.reload();
                })
                .catch(error => {
                    console.error('Error deleting card:', error);
                });
            }
        });
    });
    
    // Delete list
    const deleteListBtns = document.querySelectorAll('.delete-list-btn');
    deleteListBtns.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const listId = this.getAttribute('data-list-id');
            
            if (confirm('Are you sure you want to delete this list and all its cards?')) {
                fetch(`/api/lists/${listId}`, {
                    method: 'DELETE'
                })
                .then(response => response.json())
                .then(data => {
                    location.reload();
                })
                .catch(error => {
                    console.error('Error deleting list:', error);
                });
            }
        });
    });
}

// Drag and Drop functionality (остается без изменений)
function initializeDragAndDrop() {
    let draggedCard = null;
    let draggedCardElement = null;

    // Make all cards draggable
    const cards = document.querySelectorAll('.card');
    cards.forEach(card => {
        card.setAttribute('draggable', 'true');
        
        card.addEventListener('dragstart', function(e) {
            draggedCard = card;
            draggedCardElement = card;
            setTimeout(() => {
                card.classList.add('dragging');
            }, 0);
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', card.dataset.cardId);
        });

        card.addEventListener('dragend', function() {
            card.classList.remove('dragging');
            draggedCard = null;
            draggedCardElement = null;
            
            // Remove all drop zones
            document.querySelectorAll('.drop-zone').forEach(zone => {
                zone.remove();
            });
        });
    });

    // Make lists drop targets
    const lists = document.querySelectorAll('.list');
    lists.forEach(list => {
        list.addEventListener('dragover', function(e) {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            
            const afterElement = getDragAfterElement(list, e.clientY);
            const cardsContainer = list.querySelector('.cards-container');
            
            // Remove existing drop zones
            list.querySelectorAll('.drop-zone').forEach(zone => {
                zone.remove();
            });
            
            if (afterElement) {
                const dropZone = document.createElement('div');
                dropZone.classList.add('drop-zone');
                cardsContainer.insertBefore(dropZone, afterElement);
            } else {
                const dropZone = document.createElement('div');
                dropZone.classList.add('drop-zone');
                cardsContainer.appendChild(dropZone);
            }
        });

        list.addEventListener('dragleave', function(e) {
            // Only remove drop zones if not dragging over child elements
            if (!list.contains(e.relatedTarget)) {
                list.querySelectorAll('.drop-zone').forEach(zone => {
                    zone.remove();
                });
            }
        });

        list.addEventListener('drop', function(e) {
            e.preventDefault();
            
            if (draggedCard) {
                const cardsContainer = list.querySelector('.cards-container');
                const afterElement = getDragAfterElement(list, e.clientY);
                const dropZones = list.querySelectorAll('.drop-zone');
                
                let newPosition = 0;
                const cardsInList = Array.from(cardsContainer.querySelectorAll('.card:not(.dragging)'));
                
                if (afterElement) {
                    const afterCard = afterElement.previousElementSibling;
                    if (afterCard && afterCard.classList.contains('card')) {
                        const afterCardPosition = parseInt(afterCard.dataset.position) || 0;
                        newPosition = afterCardPosition + 1;
                    }
                } else if (cardsInList.length > 0) {
                    const lastCard = cardsInList[cardsInList.length - 1];
                    newPosition = (parseInt(lastCard.dataset.position) || 0) + 1;
                }
                
                // Remove all drop zones
                dropZones.forEach(zone => {
                    zone.remove();
                });
                
                // Move card to new list
                const cardId = draggedCard.dataset.cardId;
                const newListId = list.dataset.listId;
                
                fetch(`/api/cards/${cardId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        list_id: newListId,
                        position: newPosition
                    })
                })
                .then(response => response.json())
                .then(data => {
                    // Move card in DOM
                    if (afterElement) {
                        cardsContainer.insertBefore(draggedCard, afterElement);
                    } else {
                        cardsContainer.appendChild(draggedCard);
                    }
                    
                    // Update card's list ID
                    draggedCard.dataset.listId = newListId;
                    
                    // Update positions of all cards in the list
                    updateCardPositions(cardsContainer);
                })
                .catch(error => {
                    console.error('Error moving card:', error);
                    location.reload(); // Fallback to reload if something goes wrong
                });
            }
        });
    });
}

function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.card:not(.dragging)')];
    
    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

function updateCardPositions(container) {
    const cards = container.querySelectorAll('.card');
    cards.forEach((card, index) => {
        card.dataset.position = index;
    });
}