// Main functionality
document.addEventListener('DOMContentLoaded', function() {
    initializeDashboardFunctionality();
    initializeDragAndDrop();
    
    // Close modal when clicking outside
    window.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            closeAllModals();
        }
    });
});

function closeAllModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.style.display = 'none';
    });
}

function initializeDashboardFunctionality() {
    // List creation
    const addListBtn = document.getElementById('add-list-btn');
    const listModal = document.getElementById('list-modal');
    const cancelList = document.getElementById('cancel-list');
    const listForm = document.getElementById('list-form');
    const listNameInput = document.getElementById('list-name');
    
    if (addListBtn) {
        addListBtn.addEventListener('click', function() {
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
                    location.reload(); // Перезагружаем для нового списка
                })
                .catch(error => {
                    console.error('Error creating list:', error);
                });
            }
        });
    }
    
    // Card creation
    const addCardBtns = document.querySelectorAll('.add-card-btn, .add-card-text-btn');
    const cardDetailModal = document.getElementById('card-detail-modal');
    const cancelCardDetail = document.getElementById('cancel-card-detail');
    const cardDetailForm = document.getElementById('card-detail-form');
    
    addCardBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const listId = this.getAttribute('data-list-id');
            openCardDetailModal(null, listId);
        });
    });
    
    // Обработчики для редактирования карточки
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('edit-card-btn')) {
            e.stopPropagation();
            const cardId = e.target.getAttribute('data-card-id');
            openCardDetailModal(cardId);
        }
        
        if (e.target.classList.contains('card')) {
            const cardId = e.target.closest('.card').getAttribute('data-card-id');
            openCardDetailModal(cardId);
        }
    });
    
    if (cancelCardDetail) {
        cancelCardDetail.addEventListener('click', function() {
            cardDetailModal.style.display = 'none';
        });
    }
    
    if (cardDetailForm) {
        cardDetailForm.addEventListener('submit', function(e) {
            e.preventDefault();
            saveCardDetails();
        });
    }
    
    // Инициализация обработчиков для нового функционала
    initializeCardDetailFunctionality();
}

function openCardDetailModal(cardId = null, listId = null) {
    const modal = document.getElementById('card-detail-modal');
    const title = document.getElementById('card-modal-title');
    const cardDetailId = document.getElementById('card-detail-id');
    const cardDetailListId = document.getElementById('card-detail-list-id');
    
    // Показываем/скрываем дополнительные функции в зависимости от режима
    const additionalSections = document.querySelectorAll('.right-column, .form-section');
    
    if (cardId) {
        // Редактирование существующей карточки
        title.textContent = 'Edit Card';
        cardDetailId.value = cardId;
        // Показываем все дополнительные функции
        additionalSections.forEach(section => section.style.display = 'block');
        loadCardDetails(cardId);
    } else {
        // Создание новой карточки
        title.textContent = 'Create New Card';
        cardDetailId.value = '';
        cardDetailListId.value = listId;
        // Скрываем дополнительные функции при создании
        additionalSections.forEach(section => section.style.display = 'none');
        resetCardDetailForm();
        loadUsersAndLabels(); // Загружаем пользователей и метки для новой карточки
    }
    
    modal.style.display = 'flex';
}

function loadCardDetails(cardId) {
    // Загружаем данные карточки
    fetch(`/api/cards/${cardId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Card not found');
            }
            return response.json();
        })
        .then(card => {
            document.getElementById('card-detail-title').value = card.title;
            document.getElementById('card-detail-description').value = card.description || '';
            document.getElementById('card-detail-list-id').value = card.list_id;
            
            if (card.due_date) {
                // Конвертируем дату в формат для input[type=datetime-local]
                const dueDate = new Date(card.due_date);
                const localDateTime = dueDate.toISOString().slice(0, 16);
                document.getElementById('card-detail-due-date').value = localDateTime;
            } else {
                document.getElementById('card-detail-due-date').value = '';
            }
            
            // Загружаем связанные данные
            loadCardAssignees(card);
            loadCardLabels(card);
            loadCardChecklists(card);
            loadCardComments(card);
            loadUsersAndLabels();
        })
        .catch(error => {
            console.error('Error loading card details:', error);
            alert('Error loading card details');
        });
}

function resetCardDetailForm() {
    document.getElementById('card-detail-title').value = '';
    document.getElementById('card-detail-description').value = '';
    document.getElementById('card-detail-due-date').value = '';
    document.getElementById('assignees-container').innerHTML = '';
    document.getElementById('labels-container').innerHTML = '';
    document.getElementById('checklists-container').innerHTML = '';
    document.getElementById('comments-container').innerHTML = '';
    document.getElementById('new-comment-text').value = '';
}

function saveCardDetails() {
    const cardId = document.getElementById('card-detail-id').value;
    const listId = document.getElementById('card-detail-list-id').value;
    const title = document.getElementById('card-detail-title').value.trim();
    const description = document.getElementById('card-detail-description').value;
    const dueDate = document.getElementById('card-detail-due-date').value;
    
    if (!title) {
        alert('Title is required');
        return;
    }
    
    const url = cardId ? `/api/cards/${cardId}` : `/api/lists/${listId}/cards`;
    const method = cardId ? 'PUT' : 'POST';
    
    fetch(url, {
        method: method,
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            title: title,
            description: description,
            due_date: dueDate || null
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to save card');
        }
        return response.json();
    })
    .then(data => {
        document.getElementById('card-detail-modal').style.display = 'none';
        
        if (cardId) {
            // Обновляем существующую карточку на дашборде без перезагрузки
            updateCardOnDashboard(cardId);
        } else {
            // Для новой карточки перезагружаем страницу
            location.reload();
        }
    })
    .catch(error => {
        console.error('Error saving card:', error);
        alert('Error saving card');
    });
}

// Функция для обновления карточки на дашборде без перезагрузки
function updateCardOnDashboard(cardId) {
    fetch(`/api/cards/${cardId}`)
        .then(response => response.json())
        .then(card => {
            // Находим элемент карточки на дашборде
            const cardElement = document.querySelector(`.card[data-card-id="${cardId}"]`);
            if (cardElement) {
                // Обновляем заголовок
                const titleElement = cardElement.querySelector('.card-content h4');
                if (titleElement) {
                    titleElement.textContent = card.title;
                }
                
                // Обновляем описание
                const descriptionElement = cardElement.querySelector('.card-content p');
                if (descriptionElement) {
                    descriptionElement.textContent = card.description || '';
                } else if (card.description) {
                    // Если описания не было, но теперь есть - создаем элемент
                    const contentDiv = cardElement.querySelector('.card-content');
                    const p = document.createElement('p');
                    p.textContent = card.description;
                    contentDiv.appendChild(p);
                }
                
                // Обновляем метки
                const labelsContainer = cardElement.querySelector('.card-labels');
                labelsContainer.innerHTML = '';
                if (card.labels && card.labels.length > 0) {
                    card.labels.forEach(label => {
                        const labelSpan = document.createElement('span');
                        labelSpan.className = 'card-label';
                        labelSpan.style.backgroundColor = label.color;
                        labelSpan.title = label.name;
                        labelsContainer.appendChild(labelSpan);
                    });
                }
                
                // Обновляем бэйджи
                updateCardBadges(cardElement, card);
                
                // Обновляем назначенных пользователей
                const assigneesContainer = cardElement.querySelector('.card-assignees');
                assigneesContainer.innerHTML = '';
                if (card.assignees && card.assignees.length > 0) {
                    card.assignees.forEach(assignee => {
                        const assigneeSpan = document.createElement('span');
                        assigneeSpan.className = 'assignee-avatar';
                        assigneeSpan.title = assignee.username;
                        assigneeSpan.textContent = assignee.username[0].toUpperCase();
                        assigneesContainer.appendChild(assigneeSpan);
                    });
                }
            }
        })
        .catch(error => {
            console.error('Error updating card on dashboard:', error);
            // В случае ошибки перезагружаем страницу
            location.reload();
        });
}

function updateCardBadges(cardElement, card) {
    const badgesContainer = cardElement.querySelector('.card-badges');
    badgesContainer.innerHTML = '';
    
    // Бэдж срока
    if (card.due_date) {
        const dueDate = new Date(card.due_date);
        const now = new Date();
        const dueBadge = document.createElement('span');
        dueBadge.className = `badge due-date ${dueDate < now ? 'overdue' : ''}`;
        dueBadge.innerHTML = `📅 ${dueDate.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}`;
        badgesContainer.appendChild(dueBadge);
    }
    
    // Бэдж назначенных
    if (card.assignees && card.assignees.length > 0) {
        const assigneesBadge = document.createElement('span');
        assigneesBadge.className = 'badge assignees';
        assigneesBadge.innerHTML = `👥 ${card.assignees.length}`;
        badgesContainer.appendChild(assigneesBadge);
    }
    
    // Бэдж чек-листов
    if (card.checklists && card.checklists.length > 0) {
        let totalItems = 0;
        let completedItems = 0;
        
        card.checklists.forEach(checklist => {
            totalItems += checklist.items.length;
            completedItems += checklist.items.filter(item => item.completed).length;
        });
        
        const checklistBadge = document.createElement('span');
        checklistBadge.className = 'badge checklist';
        checklistBadge.innerHTML = `✅ ${completedItems}/${totalItems}`;
        badgesContainer.appendChild(checklistBadge);
    }
    
    // Бэдж комментариев
    if (card.comments && card.comments.length > 0) {
        const commentsBadge = document.createElement('span');
        commentsBadge.className = 'badge comments';
        commentsBadge.innerHTML = `💬 ${card.comments.length}`;
        badgesContainer.appendChild(commentsBadge);
    }
}

function initializeCardDetailFunctionality() {
    // Назначение пользователей
    document.getElementById('add-assignee-btn').addEventListener('click', function() {
        const select = document.getElementById('assignee-select');
        const userId = select.value;
        const cardId = document.getElementById('card-detail-id').value;
        
        if (!cardId) {
            alert('Please save the card first before adding assignees');
            return;
        }
        
        if (userId && cardId) {
            fetch(`/api/cards/${cardId}/assignees`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    user_id: userId
                })
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to assign user');
                }
                return response.json();
            })
            .then(() => {
                // Перезагружаем данные карточки для обновления назначений
                loadCardDetails(cardId);
                select.value = '';
            })
            .catch(error => {
                console.error('Error assigning user:', error);
                alert('Error assigning user');
            });
        }
    });
    
    // Удаление назначения
    document.getElementById('assignees-container').addEventListener('click', function(e) {
        if (e.target.classList.contains('remove-assignee')) {
            const cardId = document.getElementById('card-detail-id').value;
            const userId = e.target.getAttribute('data-user-id');
            
            if (!cardId) {
                alert('Card not saved yet');
                return;
            }
            
            fetch(`/api/cards/${cardId}/assignees/${userId}`, {
                method: 'DELETE'
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to remove assignee');
                }
                return response.json();
            })
            .then(() => {
                // Перезагружаем данные карточки
                loadCardDetails(cardId);
            })
            .catch(error => {
                console.error('Error removing assignee:', error);
                alert('Error removing assignee');
            });
        }
    });
    
    // Добавление метки
    document.getElementById('add-label-btn').addEventListener('click', function() {
        const select = document.getElementById('label-select');
        const labelId = select.value;
        const cardId = document.getElementById('card-detail-id').value;
        
        if (!cardId) {
            alert('Please save the card first before adding labels');
            return;
        }
        
        if (labelId && cardId) {
            fetch(`/api/cards/${cardId}/labels`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    label_id: labelId
                })
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to add label');
                }
                return response.json();
            })
            .then(() => {
                // Перезагружаем данные карточки
                loadCardDetails(cardId);
                select.value = '';
            })
            .catch(error => {
                console.error('Error adding label:', error);
                alert('Error adding label');
            });
        }
    });
    
    // Удаление метки
    document.getElementById('labels-container').addEventListener('click', function(e) {
        if (e.target.classList.contains('remove-label')) {
            const cardId = document.getElementById('card-detail-id').value;
            const labelId = e.target.getAttribute('data-label-id');
            
            if (!cardId) {
                alert('Card not saved yet');
                return;
            }
            
            fetch(`/api/cards/${cardId}/labels/${labelId}`, {
                method: 'DELETE'
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to remove label');
                }
                return response.json();
            })
            .then(() => {
                // Перезагружаем данные карточки
                loadCardDetails(cardId);
            })
            .catch(error => {
                console.error('Error removing label:', error);
                alert('Error removing label');
            });
        }
    });
    
    // Создание новой метки
    document.getElementById('create-label-btn').addEventListener('click', function() {
        document.getElementById('label-modal').style.display = 'flex';
    });
    
    // Чек-листы
    document.getElementById('add-checklist-btn').addEventListener('click', function() {
        const cardId = document.getElementById('card-detail-id').value;
        
        if (!cardId) {
            alert('Please save the card first before adding checklists');
            return;
        }
        
        document.getElementById('checklist-modal').style.display = 'flex';
    });
    
    // Комментарии
    document.getElementById('add-comment-btn').addEventListener('click', function() {
        const cardId = document.getElementById('card-detail-id').value;
        const text = document.getElementById('new-comment-text').value.trim();
        
        if (!cardId) {
            alert('Please save the card first before adding comments');
            return;
        }
        
        if (text && cardId) {
            fetch(`/api/cards/${cardId}/comments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    text: text
                })
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to add comment');
                }
                return response.json();
            })
            .then(() => {
                loadCardCommentsFromAPI(cardId);
                document.getElementById('new-comment-text').value = '';
            })
            .catch(error => {
                console.error('Error adding comment:', error);
                alert('Error adding comment');
            });
        }
    });
    
    // Инициализация модальных окон для меток и чек-листов
    initializeLabelModal();
    initializeChecklistModal();
}

// Вспомогательные функции для загрузки данных
function loadUsersAndLabels() {
    // Загружаем пользователей
    fetch('/api/users')
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to load users');
            }
            return response.json();
        })
        .then(users => {
            const select = document.getElementById('assignee-select');
            select.innerHTML = '<option value="">Select user to assign...</option>';
            users.forEach(user => {
                const option = document.createElement('option');
                option.value = user.id;
                option.textContent = user.username;
                select.appendChild(option);
            });
        })
        .catch(error => {
            console.error('Error loading users:', error);
        });
    
    // Загружаем метки
    fetch('/api/labels')
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to load labels');
            }
            return response.json();
        })
        .then(labels => {
            const select = document.getElementById('label-select');
            select.innerHTML = '<option value="">Select label...</option>';
            labels.forEach(label => {
                const option = document.createElement('option');
                option.value = label.id;
                option.textContent = label.name;
                select.appendChild(option);
            });
        })
        .catch(error => {
            console.error('Error loading labels:', error);
        });
}

function loadCardAssignees(card) {
    const container = document.getElementById('assignees-container');
    container.innerHTML = '';
    
    if (card.assignees && card.assignees.length > 0) {
        card.assignees.forEach(assignee => {
            const assigneeEl = document.createElement('div');
            assigneeEl.className = 'assignee-item';
            assigneeEl.innerHTML = `
                ${assignee.username}
                <button type="button" class="remove-assignee" data-user-id="${assignee.id}">×</button>
            `;
            container.appendChild(assigneeEl);
        });
    } else {
        container.innerHTML = '<div class="no-data">No assignees</div>';
    }
}

function loadCardLabels(card) {
    const container = document.getElementById('labels-container');
    container.innerHTML = '';
    
    if (card.labels && card.labels.length > 0) {
        card.labels.forEach(label => {
            const labelEl = document.createElement('div');
            labelEl.className = 'label-item';
            labelEl.style.backgroundColor = label.color;
            labelEl.innerHTML = `
                ${label.name}
                <button type="button" class="remove-label" data-label-id="${label.id}">×</button>
            `;
            container.appendChild(labelEl);
        });
    } else {
        container.innerHTML = '<div class="no-data">No labels</div>';
    }
}

function loadCardChecklists(card) {
    const container = document.getElementById('checklists-container');
    container.innerHTML = '';
    
    if (card.checklists && card.checklists.length > 0) {
        card.checklists.forEach(checklist => {
            const checklistEl = document.createElement('div');
            checklistEl.className = 'checklist';
            let itemsHTML = '';
            
            if (checklist.items && checklist.items.length > 0) {
                checklist.items.forEach(item => {
                    itemsHTML += `
                        <div class="checklist-item ${item.completed ? 'completed' : ''}">
                            <input type="checkbox" ${item.completed ? 'checked' : ''} 
                                   onchange="updateChecklistItem(${item.id}, this.checked)">
                            <span>${item.text}</span>
                        </div>
                    `;
                });
            }
            
            checklistEl.innerHTML = `
                <div class="checklist-header">
                    <h4>${checklist.title}</h4>
                    <button type="button" class="delete-checklist" onclick="deleteChecklist(${checklist.id})">Delete</button>
                </div>
                ${itemsHTML}
                <div class="add-checklist-item">
                    <input type="text" placeholder="Add an item..." id="new-item-${checklist.id}">
                    <button type="button" onclick="addChecklistItem(${checklist.id})">Add</button>
                </div>
            `;
            container.appendChild(checklistEl);
        });
    } else {
        container.innerHTML = '<div class="no-data">No checklists</div>';
    }
}

function loadCardComments(card) {
    const container = document.getElementById('comments-container');
    container.innerHTML = '';
    
    if (card.comments && card.comments.length > 0) {
        card.comments.forEach(comment => {
            const commentEl = document.createElement('div');
            commentEl.className = 'comment-item';
            const date = new Date(comment.created_at).toLocaleString();
            commentEl.innerHTML = `
                <div class="comment-author">${comment.user ? comment.user.username : 'Unknown'}</div>
                <div class="comment-text">${comment.text}</div>
                <div class="comment-date">${date}</div>
            `;
            container.appendChild(commentEl);
        });
    } else {
        container.innerHTML = '<div class="no-data">No comments</div>';
    }
}

// Функция для загрузки комментариев через API (отдельно)
function loadCardCommentsFromAPI(cardId) {
    fetch(`/api/cards/${cardId}`)
        .then(response => response.json())
        .then(card => {
            loadCardComments(card);
        })
        .catch(error => {
            console.error('Error loading comments:', error);
        });
}

// Функции для работы с чек-листами
function updateChecklistItem(itemId, completed) {
    fetch(`/api/checklist-items/${itemId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            completed: completed
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to update checklist item');
        }
        return response.json();
    })
    .then(() => {
        // Обновляем отображение
        const cardId = document.getElementById('card-detail-id').value;
        loadCardDetails(cardId);
    })
    .catch(error => {
        console.error('Error updating checklist item:', error);
        alert('Error updating checklist item');
    });
}

function addChecklistItem(checklistId) {
    const input = document.getElementById(`new-item-${checklistId}`);
    const text = input.value.trim();
    
    if (text) {
        fetch(`/api/checklists/${checklistId}/items`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                text: text
            })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to add checklist item');
            }
            return response.json();
        })
        .then(() => {
            input.value = '';
            const cardId = document.getElementById('card-detail-id').value;
            loadCardDetails(cardId);
        })
        .catch(error => {
            console.error('Error adding checklist item:', error);
            alert('Error adding checklist item');
        });
    }
}

function deleteChecklist(checklistId) {
    if (confirm('Are you sure you want to delete this checklist?')) {
        fetch(`/api/checklists/${checklistId}`, {
            method: 'DELETE'
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to delete checklist');
            }
            return response.json();
        })
        .then(() => {
            const cardId = document.getElementById('card-detail-id').value;
            loadCardDetails(cardId);
        })
        .catch(error => {
            console.error('Error deleting checklist:', error);
            alert('Error deleting checklist');
        });
    }
}

// Функции для модальных окон меток и чек-листов
function initializeLabelModal() {
    const modal = document.getElementById('label-modal');
    const form = document.getElementById('label-form');
    const cancelBtn = document.getElementById('cancel-label');
    
    cancelBtn.addEventListener('click', function() {
        modal.style.display = 'none';
    });
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        const name = document.getElementById('label-name').value.trim();
        const color = document.getElementById('label-color').value;
        
        if (name) {
            fetch('/api/labels', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: name,
                    color: color
                })
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to create label');
                }
                return response.json();
            })
            .then(label => {
                modal.style.display = 'none';
                form.reset();
                // Обновляем список меток
                loadUsersAndLabels();
            })
            .catch(error => {
                console.error('Error creating label:', error);
                alert('Error creating label');
            });
        }
    });
}

function initializeChecklistModal() {
    const modal = document.getElementById('checklist-modal');
    const form = document.getElementById('checklist-form');
    const cancelBtn = document.getElementById('cancel-checklist');
    
    cancelBtn.addEventListener('click', function() {
        modal.style.display = 'none';
    });
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        const title = document.getElementById('checklist-title').value.trim();
        const cardId = document.getElementById('card-detail-id').value;
        
        if (title && cardId) {
            fetch(`/api/cards/${cardId}/checklists`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    title: title
                })
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to create checklist');
                }
                return response.json();
            })
            .then(checklist => {
                modal.style.display = 'none';
                form.reset();
                loadCardDetails(cardId);
            })
            .catch(error => {
                console.error('Error creating checklist:', error);
                alert('Error creating checklist');
            });
        }
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