// Main functionality
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 DOM loaded, initializing app...');
    
    initializeDirectDeleteHandlers();
    initializeDashboardFunctionality();
    initializeDragAndDrop();
    
    // Инициализация модальных окон с безопасной проверкой
    setTimeout(() => {
        console.log('🔄 Initializing modals...');
        
        // Проверим, существует ли модальное окно меток в DOM
        const labelModal = document.getElementById('label-modal');
        console.log('Label modal element found:', !!labelModal);
        
        if (labelModal) {
            console.log('Label modal HTML:', labelModal.outerHTML);
        }
        
        // Пытаемся инициализировать label modal
        try {
            const labelModalSuccess = initializeLabelModal();
            console.log('Label modal initialization:', labelModalSuccess ? 'SUCCESS' : 'FAILED');
        } catch (error) {
            console.error('❌ Error initializing label modal:', error);
        }
    }, 200);
    
    console.log('✅ App initialization completed');
    
    // Close modal when clicking outside
    window.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            closeAllModals();
        }
    });
});

function initializeDirectDeleteHandlers() {
    // Обработчики для удаления карточек
    document.querySelectorAll('.delete-card-btn').forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            const cardId = this.getAttribute('data-card-id');
            console.log('Direct handler - Delete card:', cardId);
            deleteCard(cardId);
        });
    });
    
    // Обработчики для удаления списков
    document.querySelectorAll('.delete-list-btn').forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            const listId = this.getAttribute('data-list-id');
            console.log('Direct handler - Delete list:', listId);
            deleteList(listId);
        });
    });
}


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
        setTimeout(() => {
    reinitializeDragAndDrop();
}, 500);
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
    
    // Инициализация обработчиков для удаления
    // initializeDeleteHandlers(); // <-- ДОБАВЬТЕ ЭТУ СТРОЧКУ
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
    console.log('Loading card details for ID:', cardId);
    
    fetch(`/api/cards/${cardId}`)
        .then(response => {
            console.log('Response status:', response.status);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(card => {
            console.log('Card data received:', card);
            
            document.getElementById('card-detail-title').value = card.title;
            document.getElementById('card-detail-description').value = card.description || '';
            document.getElementById('card-detail-list-id').value = card.list_id;
            
            if (card.due_date) {
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
            loadCardComments(card); // Эта функция теперь определена
            loadUsersAndLabels();
        })
        .catch(error => {
            console.error('Error loading card details:', error);
            alert('Error loading card details: ' + error.message);
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
            updateCardOnDashboard(cardId);
        } else {
            // Для новой карточки перезагружаем страницу
            location.reload();
        }
        
        // Переинициализируем drag & drop
        setTimeout(reinitializeDragAndDrop, 100);
    })
    .catch(error => {
        console.error('Error saving card:', error);
        alert('Error saving card');
    });
}

function reinitializeDragAndDrop() {
    console.log('🔄 Reinitializing enhanced drag and drop...');
    
    // Убираем все старые индикаторы
    document.querySelectorAll('.drop-indicator').forEach(indicator => {
        indicator.remove();
    });
    
    // Снимаем все классы drag-over
    document.querySelectorAll('.drag-over').forEach(el => {
        el.classList.remove('drag-over');
    });
    
    // Переинициализируем
    initializeDragAndDrop();
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
    console.log('🔄 Initializing card detail functionality...');
    
    // Назначение пользователей
    const addAssigneeBtn = document.getElementById('add-assignee-btn');
    if (addAssigneeBtn) {
        addAssigneeBtn.addEventListener('click', function() {
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
    }
    
    // Удаление назначения
    const assigneesContainer = document.getElementById('assignees-container');
    if (assigneesContainer) {
        assigneesContainer.addEventListener('click', function(e) {
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
    }
    
    // Добавление метки
    const addLabelBtn = document.getElementById('add-label-btn');
    if (addLabelBtn) {
        addLabelBtn.addEventListener('click', function() {
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
    }
    
    // Удаление метки
    const labelsContainer = document.getElementById('labels-container');
    if (labelsContainer) {
        labelsContainer.addEventListener('click', function(e) {
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
    }
    
    // Создание новой метки
const createLabelBtn = document.getElementById('create-label-btn');
if (createLabelBtn) {
    createLabelBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        console.log('🎨 Opening label creation modal');
        
        const modal = document.getElementById('label-modal');
        if (modal) {
            console.log('✅ Label modal found, displaying it');
            modal.style.display = 'flex';
            
            // Сфокусироваться на поле ввода
            const nameInput = document.getElementById('label-name');
            if (nameInput) {
                nameInput.focus();
            }
        } else {
            console.error('❌ Label modal not found in DOM');
        }
    });
} else {
    console.error('❌ Create label button not found');
}
    
    // Комментарии
    const addCommentBtn = document.getElementById('add-comment-btn');
    if (addCommentBtn) {
        addCommentBtn.addEventListener('click', function() {
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
    }
    
    // Инициализация модальных окон для меток и чек-листов
    initializeChecklistEventHandlers();
    initializeChecklistModal(); // Теперь эта функция безопасна
    
    console.log('✅ Card detail functionality initialized');
}



// Функция для загрузки комментариев
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
    const actionsContainer = document.getElementById('checklist-actions-container');
    
    container.innerHTML = '';
    actionsContainer.innerHTML = '';

    if (card.checklists && card.checklists.length > 0) {
        const checklist = card.checklists[0];
        
        const checklistEl = document.createElement('div');
        checklistEl.className = 'checklist';
        
        let itemsHTML = '';
        if (checklist.items && checklist.items.length > 0) {
            checklist.items.forEach(item => {
                // УБЕДИТЕСЬ, что data-item-id устанавливается правильно
                itemsHTML += `
                    <div class="checklist-item ${item.completed ? 'completed' : ''}">
                        <input type="checkbox" 
                               data-item-id="${item.id}"
                               ${item.completed ? 'checked' : ''}
                               onchange="updateChecklistItem(${item.id}, this.checked)">
                        <span class="checklist-item-text">${item.text}</span>
                        <div class="checklist-item-actions">
                            <button type="button" class="remove-checklist-item" 
                                    onclick="deleteChecklistItem(${item.id})">×</button>
                        </div>
                    </div>
                `;
            });
        }
        
        checklistEl.innerHTML = `
            <div class="checklist-header">
                <h4>${checklist.title}</h4>
                ${checklist.items && checklist.items.length > 0 ? 
                    `<button type="button" class="delete-checklist btn btn-secondary btn-sm" 
                            onclick="deleteChecklist(${checklist.id})">Delete All</button>` : 
                    ''
                }
            </div>
            <div class="checklist-items">
                ${itemsHTML || '<div class="no-data">No items yet</div>'}
            </div>
        `;
        container.appendChild(checklistEl);

        actionsContainer.innerHTML = `
            <div class="add-item-form">
                <input type="text" id="new-checklist-item" placeholder="Add an item..." class="form-control">
                <button type="button" onclick="addChecklistItem(${checklist.id})" class="btn btn-primary btn-sm">Add Item</button>
            </div>
        `;
    } else {
        actionsContainer.innerHTML = `
            <div class="no-checklist">
                <button type="button" id="create-first-checklist" class="btn btn-primary">Create Checklist</button>
            </div>
        `;
    }
}

function initializeChecklistEventHandlers() {
    // Делегирование событий для чекбоксов - ПРЕДОТВРАЩАЕМ ПЕРЕЗАГРУЗКУ
    document.addEventListener('change', function(e) {
        if (e.target.matches('#checklists-container input[type="checkbox"]')) {
            e.preventDefault();
            e.stopPropagation();
            
            const itemId = e.target.getAttribute('data-item-id');
            const completed = e.target.checked;
            
            if (itemId) {
                console.log('Checkbox changed:', itemId, 'checked:', completed);
                updateChecklistItem(itemId, completed);
            }
        }
    });
    
    // Делегирование событий для удаления пунктов чек-листа
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('remove-checklist-item')) {
            e.preventDefault();
            e.stopPropagation();
            
            const itemId = e.target.getAttribute('data-item-id');
            if (itemId) {
                deleteChecklistItem(itemId);
            }
        }
        
        if (e.target.classList.contains('delete-checklist')) {
            e.preventDefault();
            e.stopPropagation();
            
            const checklistId = e.target.getAttribute('data-checklist-id');
            if (checklistId) {
                deleteChecklist(checklistId);
            }
        }
    });
    
    // Обработчик для добавления нового пункта
    document.addEventListener('click', function(e) {
        if (e.target.id === 'add-checklist-item-btn') {
            e.preventDefault();
            e.stopPropagation();
            
            const checklistId = e.target.getAttribute('data-checklist-id');
            if (checklistId) {
                addChecklistItem(checklistId);
            }
        }
        
        if (e.target.id === 'create-first-checklist') {
            e.preventDefault();
            e.stopPropagation();
            
            const cardId = document.getElementById('card-detail-id').value;
            createFirstChecklist(cardId);
        }
    });
    
    // Обработчик для поля ввода (Enter) - ПРЕДОТВРАЩАЕМ ОТПРАВКУ ФОРМЫ
    document.addEventListener('keypress', function(e) {
        if (e.target.id === 'new-checklist-item' && e.key === 'Enter') {
            e.preventDefault();
            e.stopPropagation();
            
            const checklistId = document.querySelector('#add-checklist-item-btn')?.getAttribute('data-checklist-id');
            if (checklistId) {
                addChecklistItem(checklistId);
            }
        }
    });
    
    // Дополнительная защита: предотвращаем отправку формы при любых действиях в чек-листе
    const checklistContainer = document.getElementById('checklists-container');
    if (checklistContainer) {
        checklistContainer.addEventListener('submit', function(e) {
            e.preventDefault();
            e.stopPropagation();
        });
        
        checklistContainer.addEventListener('click', function(e) {
            if (e.target.type === 'checkbox' || 
                e.target.classList.contains('remove-checklist-item') ||
                e.target.classList.contains('delete-checklist') ||
                e.target.id === 'add-checklist-item-btn') {
                e.stopPropagation();
            }
        });
    }
}

// Создать первый чек-лист для карточки
function createFirstChecklist(cardId) {
    if (!cardId) {
        alert('Please save the card first');
        return;
    }

    fetch(`/api/cards/${cardId}/checklists`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            title: 'Checklist'
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to create checklist');
        }
        return response.json();
    })
    .then(checklist => {
        // После создания чек-листа, загружаем обновленные данные карточки
        loadCardDetails(cardId);
    })
    .catch(error => {
        console.error('Error creating checklist:', error);
        alert('Error creating checklist');
    });
}

// Добавить пункт в чек-лист
function addChecklistItem(checklistId) {
    const input = document.getElementById('new-checklist-item');
    const text = input.value.trim();
    
    if (!text) {
        alert('Please enter item text');
        return;
    }
    
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
        input.value = ''; // Очищаем поле ввода
        const cardId = document.getElementById('card-detail-id').value;
        loadCardDetails(cardId);
    })
    .catch(error => {
        console.error('Error adding checklist item:', error);
        alert('Error adding checklist item: ' + error.message);
    });
}

// Обновить статус пункта чек-листа
// Обновить статус пункта чек-листа
// Обновить статус пункта чек-листа
function updateChecklistItem(itemId, completed) {
    console.log('🔄 Updating checklist item:', itemId, 'completed:', completed);
    
    // Проверяем, что itemId валиден
    if (!itemId || isNaN(parseInt(itemId))) {
        console.error('❌ Invalid itemId:', itemId);
        alert('Invalid checklist item ID');
        return;
    }
    
    // Оптимистичное обновление UI
    const itemElement = document.querySelector(`input[data-item-id="${itemId}"]`);
    const checklistItem = itemElement ? itemElement.closest('.checklist-item') : null;
    
    if (checklistItem) {
        if (completed) {
            checklistItem.classList.add('completed');
        } else {
            checklistItem.classList.remove('completed');
        }
    }
    
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
        console.log('📡 Response status:', response.status);
        if (!response.ok) {
            // Получаем текст ошибки для лучшей диагностики
            return response.text().then(text => {
                throw new Error(`HTTP ${response.status}: ${text}`);
            });
        }
        return response.json();
    })
    .then(data => {
        console.log('✅ Checklist item updated successfully:', data);
        
        // Обновляем бейдж прогресса
        const cardId = document.getElementById('card-detail-id').value;
        updateChecklistProgressBadge(cardId);
        
        showNotification('Checklist item updated');
    })
    .catch(error => {
        console.error('❌ Error updating checklist item:', error);
        
        // Откатываем изменения в UI
        if (checklistItem && itemElement) {
            if (completed) {
                checklistItem.classList.remove('completed');
                itemElement.checked = false;
            } else {
                checklistItem.classList.add('completed');
                itemElement.checked = true;
            }
        }
        
        alert('Error updating checklist item: ' + error.message);
    });
}

// Удалить пункт чек-листа
function deleteChecklistItem(itemId) {
    if (confirm('Are you sure you want to delete this item?')) {
        fetch(`/api/checklist-items/${itemId}`, {
            method: 'DELETE'
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to delete checklist item');
            }
            return response.json();
        })
        .then(() => {
            const cardId = document.getElementById('card-detail-id').value;
            loadCardDetails(cardId);
        })
        .catch(error => {
            console.error('Error deleting checklist item:', error);
            alert('Error deleting checklist item');
        });
    }
}

// Удалить чек-лист
function deleteChecklist(checklistId) {
    if (confirm('Are you sure you want to delete this checklist and all its items?')) {
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
    console.log('🔄 Initializing label modal...');
    
    const modal = document.getElementById('label-modal');
    if (!modal) {
        console.error('❌ Label modal not found!');
        return;
    }
    
    const form = document.getElementById('label-form');
    const cancelBtn = document.getElementById('cancel-label');
    
    if (!form) {
        console.error('❌ Label form not found!');
        return;
    }
    
    if (!cancelBtn) {
        console.error('❌ Cancel label button not found!');
        return;
    }
    
    // Обработчик для кнопки отмены
    cancelBtn.addEventListener('click', function(e) {
        e.preventDefault();
        console.log('❌ Cancel label creation');
        modal.style.display = 'none';
        form.reset();
    });
    
    // Обработчик для отправки формы
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        console.log('📨 Submitting label form...');
        
        const nameInput = document.getElementById('label-name');
        const colorInput = document.getElementById('label-color');
        
        if (!nameInput || !colorInput) {
            console.error('❌ Label form inputs not found!');
            return;
        }
        
        const name = nameInput.value.trim();
        const color = colorInput.value;
        
        console.log('🎨 Creating label:', { name, color });
        
        if (!name) {
            alert('Please enter label name');
            return;
        }
        
        // Отправляем запрос на создание метки
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
            console.log('📡 Response status:', response.status);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(label => {
            console.log('✅ Label created successfully:', label);
            
            // Закрываем модальное окно
            modal.style.display = 'none';
            form.reset();
            
            // Обновляем список меток
            loadUsersAndLabels();
            
            // Показываем уведомление
            showNotification('Label created successfully!');
        })
        .catch(error => {
            console.error('❌ Error creating label:', error);
            alert('Error creating label: ' + error.message);
        });
    });
    
    console.log('✅ Label modal initialized successfully');
}

function loadUsersAndLabels() {
    console.log('🔄 Loading users and labels...');
    
    // Загружаем пользователей
    fetch('/api/users')
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to load users');
            }
            return response.json();
        })
        .then(users => {
            console.log(`✅ Loaded ${users.length} users`);
            const select = document.getElementById('assignee-select');
            if (select) {
                select.innerHTML = '<option value="">Select user to assign...</option>';
                users.forEach(user => {
                    const option = document.createElement('option');
                    option.value = user.id;
                    option.textContent = user.username;
                    select.appendChild(option);
                });
            }
        })
        .catch(error => {
            console.error('❌ Error loading users:', error);
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
            console.log(`✅ Loaded ${labels.length} labels`);
            const select = document.getElementById('label-select');
            if (select) {
                select.innerHTML = '<option value="">Select label...</option>';
                labels.forEach(label => {
                    const option = document.createElement('option');
                    option.value = label.id;
                    option.textContent = label.name;
                    select.appendChild(option);
                });
            }
        })
        .catch(error => {
            console.error('❌ Error loading labels:', error);
        });
}

function initializeChecklistModal() {
    console.log('🔄 Initializing checklist modal...');
    
    const modal = document.getElementById('checklist-modal');
    const form = document.getElementById('checklist-form');
    const cancelBtn = document.getElementById('cancel-checklist');
    
    // Если элементы не существуют, просто выходим из функции
    if (!modal || !form || !cancelBtn) {
        console.log('ℹ️ Checklist modal elements not found - skipping initialization');
        return;
    }
    
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
    
    console.log('✅ Checklist modal initialized');
}

// Drag and Drop functionality (остается без изменений)
function initializeDragAndDrop() {
    console.log('🚀 Initializing enhanced drag and drop...');
    
    let draggedCard = null;
    let startList = null;
    let currentDropTarget = null;

    // Создаем индикатор для подсветки места вставки
    function createDropIndicator() {
        const indicator = document.createElement('div');
        indicator.className = 'drop-indicator';
        return indicator;
    }

    // Показываем индикатор в определенной позиции
    function showDropIndicator(container, referenceElement) {
        hideDropIndicators();
        
        const indicator = createDropIndicator();
        
        if (referenceElement) {
            container.insertBefore(indicator, referenceElement);
        } else {
            container.appendChild(indicator);
        }
        
        return indicator;
    }

    // Скрываем все индикаторы
    function hideDropIndicators() {
        document.querySelectorAll('.drop-indicator').forEach(indicator => {
            indicator.remove();
        });
    }

    // Определяем элемент, после которого нужно вставить
    function getDragAfterElement(container, y) {
        const cards = container.querySelectorAll('.card:not(.dragging)');
        let closestElement = null;
        let closestOffset = Number.NEGATIVE_INFINITY;

        cards.forEach(card => {
            const box = card.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            
            if (offset < 0 && offset > closestOffset) {
                closestOffset = offset;
                closestElement = card;
            }
        });

        return closestElement;
    }

    // Делаем все карточки перетаскиваемыми
    document.addEventListener('dragstart', function(e) {
        const card = e.target.closest('.card');
        if (!card) return;
        
        console.log('📦 Drag started:', card.dataset.cardId, 'from list:', card.closest('.list').dataset.listId);
        
        draggedCard = card;
        startList = card.closest('.list');
        currentDropTarget = null;
        
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', card.dataset.cardId);
        
        // Визуальный эффект
        setTimeout(() => {
            card.classList.add('dragging');
        }, 0);
    });

    document.addEventListener('dragend', function(e) {
        if (!draggedCard) return;
        
        console.log('🏁 Drag ended');
        draggedCard.classList.remove('dragging');
        draggedCard = null;
        startList = null;
        currentDropTarget = null;
        
        // Убираем все индикаторы и подсветку
        hideDropIndicators();
        document.querySelectorAll('.drag-over').forEach(el => {
            el.classList.remove('drag-over');
        });
    });

    // Обработка перетаскивания
    document.addEventListener('dragover', function(e) {
        e.preventDefault();
        if (!draggedCard) return;
        
        // Ищем целевой список или контейнер карточек
        let targetList = e.target.closest('.list');
        let targetCardsContainer = e.target.closest('.cards-container');
        
        // Если навели на карточку, берем её список
        if (!targetList && !targetCardsContainer) {
            const card = e.target.closest('.card');
            if (card) {
                targetList = card.closest('.list');
                targetCardsContainer = targetList.querySelector('.cards-container');
            }
        }
        
        // Если нашли подходящую цель для drop
        if (targetList || targetCardsContainer) {
            if (!targetList && targetCardsContainer) {
                targetList = targetCardsContainer.closest('.list');
            }
            
            e.dataTransfer.dropEffect = 'move';
            list.classList.add('drag-over');
        }
    });

    document.addEventListener('dragleave', function(e) {
        if (!draggedCard) return;
        
        const list = e.target.closest('.list');
        if (list && !list.contains(e.relatedTarget)) {
            list.classList.remove('drag-over');
        }
    });

    // Обработка отпускания
    document.addEventListener('drop', function(e) {
        e.preventDefault();
        if (!draggedCard) return;
        
        const list = e.target.closest('.list');
        if (list && list !== startList) {
            console.log('🎯 Dropped on list:', list.dataset.listId);
            
            // Подсвечиваем список
            if (targetList && targetList !== currentDropTarget) {
                document.querySelectorAll('.list.drag-over').forEach(list => {
                    list.classList.remove('drag-over');
                });
                targetList.classList.add('drag-over');
                currentDropTarget = targetList;
            }
            
            // Показываем индикатор в нужном месте
            if (targetCardsContainer) {
                const afterElement = getDragAfterElement(targetCardsContainer, e.clientY);
                showDropIndicator(targetCardsContainer, afterElement);
            }
        }
    });

    document.addEventListener('dragleave', function(e) {
        if (!draggedCard) return;
        
        // Проверяем, действительно ли мы вышли из элемента
        const relatedTarget = e.relatedTarget;
        const currentTarget = e.currentTarget;
        
        if (!currentTarget.contains(relatedTarget)) {
            const list = e.target.closest('.list');
            if (list) {
                list.classList.remove('drag-over');
                hideDropIndicators();
                currentDropTarget = null;
            }
        }
    });

    // Обработка отпускания
    document.addEventListener('drop', function(e) {
        e.preventDefault();
        if (!draggedCard) return;
        
        const targetList = e.target.closest('.list');
        const targetCardsContainer = targetList ? targetList.querySelector('.cards-container') : null;
        
        if (targetList && targetCardsContainer) {
            console.log('🎯 Dropped on list:', targetList.dataset.listId);
            
            const cardId = draggedCard.dataset.cardId;
            const newListId = targetList.dataset.listId;
            const dropIndicator = targetCardsContainer.querySelector('.drop-indicator');
            
            // Определяем новую позицию
            let newPosition = 0;
            const cardsInTargetList = Array.from(targetCardsContainer.querySelectorAll('.card:not(.dragging)'));
            
            // Если есть индикатор, определяем позицию относительно него
            if (dropIndicator) {
                const indicatorIndex = Array.from(targetCardsContainer.children).indexOf(dropIndicator);
                if (indicatorIndex > 0) {
                    // Вставляем перед элементом, следующим за индикатором
                    const nextCard = targetCardsContainer.children[indicatorIndex + 1];
                    if (nextCard && nextCard.classList.contains('card')) {
                        targetCardsContainer.insertBefore(draggedCard, nextCard);
                        newPosition = Array.from(targetCardsContainer.querySelectorAll('.card')).indexOf(draggedCard);
                    } else {
                        // Или в конец, если индикатор последний
                        targetCardsContainer.appendChild(draggedCard);
                        newPosition = cardsInTargetList.length;
                    }
                } else {
                    // Индикатор первый - вставляем в начало
                    targetCardsContainer.insertBefore(draggedCard, targetCardsContainer.firstChild);
                    newPosition = 0;
                }
            } else {
                // Индикатора нет - вставляем в конец
                targetCardsContainer.appendChild(draggedCard);
                newPosition = cardsInTargetList.length;
            }
            
            // Обновляем listId карточки
            draggedCard.dataset.listId = newListId;
            
            // Убираем индикаторы и подсветку
            hideDropIndicators();
            targetList.classList.remove('drag-over');
            
            // Отправляем запрос на сервер
            fetch(`/api/cards/${cardId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    list_id: parseInt(newListId),
                    position: newPosition
                })
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                console.log('✅ Card moved successfully');
                showNotification('Card moved successfully');
                
                // Обновляем позиции в исходном и целевом списках
                if (startList && startList !== targetList) {
                    updateCardPositions(startList.querySelector('.cards-container'));
                }
                updateCardPositions(targetCardsContainer);
            })
            .catch(error => {
                console.error('❌ Error moving card:', error);
                // Возвращаем обратно при ошибке
                if (startList) {
                    startList.querySelector('.cards-container').appendChild(draggedCard);
                    draggedCard.dataset.listId = startList.dataset.listId;
                    updateCardPositions(startList.querySelector('.cards-container'));
                }
                showNotification('Error moving card', true);
            });
        }
    });

    // Функция для обновления позиций карточек
    function updateCardPositions(container) {
        if (!container) return;
        
        const cards = container.querySelectorAll('.card');
        cards.forEach((card, index) => {
            card.dataset.position = index;
        });
    }

    console.log('✅ Enhanced drag and drop initialized');
}

// ==================== УДАЛЕНИЕ КАРТОЧЕК И СПИСКОВ ====================

// ==================== ФУНКЦИИ УДАЛЕНИЯ ====================

// Удаление карточки
function deleteCard(cardId) {
    console.log('Deleting card:', cardId);
    
    if (confirm('Are you sure you want to delete this card?')) {
        fetch(`/api/cards/${cardId}`, {
            method: 'DELETE'
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to delete card');
            }
            return response.json();
        })
        .then(data => {
            console.log('Card deleted successfully');
            const cardElement = document.querySelector(`.card[data-card-id="${cardId}"]`);
            if (cardElement) {
                cardElement.remove();
            }
            showNotification('Card deleted successfully');
            // Переинициализируем drag & drop
            setTimeout(reinitializeDragAndDrop, 100);
        })
        .catch(error => {
            console.error('Error deleting card:', error);
            alert('Error deleting card: ' + error.message);
        });
    }
}

// Удаление списка
function deleteList(listId) {
    console.log('Deleting list:', listId);
    
    if (confirm('Are you sure you want to delete this list and all its cards?')) {
        fetch(`/api/lists/${listId}`, {
            method: 'DELETE'
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to delete list');
            }
            return response.json();
        })
        .then(data => {
            console.log('List deleted successfully');
            // Удаляем список из DOM
            const listElement = document.querySelector(`.list[data-list-id="${listId}"]`);
            if (listElement) {
                listElement.remove();
            }
            // Показываем уведомление
            showNotification('List deleted successfully');
        })
        .catch(error => {
            console.error('Error deleting list:', error);
            alert('Error deleting list: ' + error.message);
        });
    }
}

function showNotification(message, isError = false) {
    // Remove existing notifications
    document.querySelectorAll('.notification').forEach(notification => {
        notification.remove();
    });
    
    const notification = document.createElement('div');
    notification.className = `notification ${isError ? 'error' : 'success'}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 3000);
}

// 

// function createFirstChecklist(cardId) {
//     if (!cardId) {
//         alert('Please save the card first');
//         return;
//     }

//     fetch(`/api/cards/${cardId}/checklists`, {
//         method: 'POST',
//         headers: {
//             'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({
//             title: 'Checklist'
//         })
//     })
//     .then(response => {
//         if (!response.ok) {
//             throw new Error('Failed to create checklist');
//         }
//         return response.json();
//     })
//     .then(checklist => {
//         // После создания чек-листа, загружаем обновленные данные карточки
//         loadCardDetails(cardId);
//     })
//     .catch(error => {
//         console.error('Error creating checklist:', error);
//         alert('Error creating checklist');
//     });
// }

// // Добавить пункт в чек-лист
// function addChecklistItem(checklistId) {
//     const input = document.getElementById('new-checklist-item');
//     const text = input.value.trim();
    
//     if (!text) {
//         alert('Please enter item text');
//         return;
//     }
    
//     fetch(`/api/checklists/${checklistId}/items`, {
//         method: 'POST',
//         headers: {
//             'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({
//             text: text,
//             position: 0
//         })
//     })
//     .then(response => {
//         if (!response.ok) {
//             throw new Error('Failed to add checklist item');
//         }
//         return response.json();
//     })
//     .then(() => {
//         input.value = ''; // Очищаем поле ввода
//         const cardId = document.getElementById('card-detail-id').value;
//         loadCardDetails(cardId);
//     })
//     .catch(error => {
//         console.error('Error adding checklist item:', error);
//         alert('Error adding checklist item: ' + error.message);
//     });
// }

// // Обновить статус пункта чек-листа
// function updateChecklistItem(itemId, completed) {
//     console.log('Updating checklist item:', itemId, 'completed:', completed);
    
//     // Оптимистичное обновление UI - сразу меняем внешний вид
//     const itemElement = document.querySelector(`[data-item-id="${itemId}"]`);
//     const checklistItem = itemElement ? itemElement.closest('.checklist-item') : null;
    
//     if (checklistItem) {
//         if (completed) {
//             checklistItem.classList.add('completed');
//         } else {
//             checklistItem.classList.remove('completed');
//         }
//     }
    
//     fetch(`/api/checklist-items/${itemId}`, {
//         method: 'PUT',
//         headers: {
//             'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({
//             completed: completed
//         })
//     })
//     .then(response => {
//         if (!response.ok) {
//             throw new Error('Failed to update checklist item');
//         }
//         return response.json();
//     })
//     .then(() => {
//         console.log('Checklist item updated successfully');
        
//         // Только обновляем бейдж прогресса на карточке, не перезагружая всю карточку
//         const cardId = document.getElementById('card-detail-id').value;
//         updateChecklistProgressBadge(cardId);
        
//         showNotification('Checklist item updated');
//     })
//     .catch(error => {
//         console.error('Error updating checklist item:', error);
        
//         // Откатываем изменения в UI при ошибке
//         if (checklistItem) {
//             if (completed) {
//                 checklistItem.classList.remove('completed');
//                 itemElement.checked = false;
//             } else {
//                 checklistItem.classList.add('completed');
//                 itemElement.checked = true;
//             }
//         }
//         alert('Error updating checklist item');
//     });
// }

// // Функция для обновления только бейджа прогресса чек-листа
function updateChecklistProgressBadge(cardId) {
    if (!cardId) return;
    
    // Находим элемент карточки на дашборде
    const cardElement = document.querySelector(`.card[data-card-id="${cardId}"]`);
    if (!cardElement) return;
    
    // Находим бейдж чек-листа
    const checklistBadge = cardElement.querySelector('.badge.checklist');
    if (!checklistBadge) return;
    
    // Пересчитываем прогресс на основе текущего состояния в модальном окне
    const checklistsContainer = document.getElementById('checklists-container');
    const allItems = checklistsContainer.querySelectorAll('.checklist-item');
    const completedItems = checklistsContainer.querySelectorAll('.checklist-item.completed');
    
    checklistBadge.innerHTML = `✅ ${completedItems.length}/${allItems.length}`;
}

// // Удалить пункт чек-листа
// function deleteChecklistItem(itemId) {
//     if (confirm('Are you sure you want to delete this item?')) {
//         fetch(`/api/checklist-items/${itemId}`, {
//             method: 'DELETE'
//         })
//         .then(response => {
//             if (!response.ok) {
//                 throw new Error('Failed to delete checklist item');
//             }
//             return response.json();
//         })
//         .then(() => {
//             const cardId = document.getElementById('card-detail-id').value;
//             loadCardDetails(cardId);
//         })
//         .catch(error => {
//             console.error('Error deleting checklist item:', error);
//             alert('Error deleting checklist item');
//         });
//     }
// }

// // Удалить чек-лист
// function deleteChecklist(checklistId) {
//     if (confirm('Are you sure you want to delete this checklist and all its items?')) {
//         fetch(`/api/checklists/${checklistId}`, {
//             method: 'DELETE'
//         })
//         .then(response => {
//             if (!response.ok) {
//                 throw new Error('Failed to delete checklist');
//             }
//             return response.json();
//         })
//         .then(() => {
//             const cardId = document.getElementById('card-detail-id').value;
//             loadCardDetails(cardId);
//         })
//         .catch(error => {
//             console.error('Error deleting checklist:', error);
//             alert('Error deleting checklist');
//         });
//     }
// }

// // Функции для модальных окон меток и чек-листов
// function initializeLabelModal() {
//     const modal = document.getElementById('label-modal');
//     const form = document.getElementById('label-form');
//     const cancelBtn = document.getElementById('cancel-label');
    
//     cancelBtn.addEventListener('click', function() {
//         modal.style.display = 'none';
//     });
    
//     form.addEventListener('submit', function(e) {
//         e.preventDefault();
//         const name = document.getElementById('label-name').value.trim();
//         const color = document.getElementById('label-color').value;
        
//         if (name) {
//             fetch('/api/labels', {
//                 method: 'POST',
//                 headers: {
//                     'Content-Type': 'application/json',
//                 },
//                 body: JSON.stringify({
//                     name: name,
//                     color: color
//                 })
//             })
//             .then(response => {
//                 if (!response.ok) {
//                     throw new Error('Failed to create label');
//                 }
//                 return response.json();
//             })
//             .then(label => {
//                 modal.style.display = 'none';
//                 form.reset();
//                 // Обновляем список меток
//                 loadUsersAndLabels();
//             })
//             .catch(error => {
//                 console.error('Error creating label:', error);
//                 alert('Error creating label');
//             });
//         }
//     });
// }

// function initializeChecklistModal() {
//     const modal = document.getElementById('checklist-modal');
//     const form = document.getElementById('checklist-form');
//     const cancelBtn = document.getElementById('cancel-checklist');
    
//     cancelBtn.addEventListener('click', function() {
//         modal.style.display = 'none';
//     });
    
//     form.addEventListener('submit', function(e) {
//         e.preventDefault();
//         const title = document.getElementById('checklist-title').value.trim();
//         const cardId = document.getElementById('card-detail-id').value;
        
//         if (title && cardId) {
//             fetch(`/api/cards/${cardId}/checklists`, {
//                 method: 'POST',
//                 headers: {
//                     'Content-Type': 'application/json',
//                 },
//                 body: JSON.stringify({
//                     title: title
//                 })
//             })
//             .then(response => {
//                 if (!response.ok) {
//                     throw new Error('Failed to create checklist');
//                 }
//                 return response.json();
//             })
//             .then(checklist => {
//                 modal.style.display = 'none';
//                 form.reset();
//                 loadCardDetails(cardId);
//             })
//             .catch(error => {
//                 console.error('Error creating checklist:', error);
//                 alert('Error creating checklist');
//             });
//         }
//     });
// }
