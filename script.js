// Configurações Globais
// IMPORTANTE: Altere este número se necessário.
// O DDD de Goiás (62) usa o dígito 9 na frente para celulares.
// Usamos '5562985796998' (+55 62 98579-6998) que é o formato padrão.
const WHATSAPP_PHONE = '5562985796998';

// Lista de horários de atendimento disponíveis padrão (de hora em hora, das 08:00 às 20:00)
const AVAILABLE_HOURS = [
    "08:00",
    "09:00",
    "10:00",
    "11:00",
    "12:00",
    "13:00",
    "14:00",
    "15:00",
    "16:00",
    "17:00",
    "18:00",
    "19:00",
    "20:00"
];

// Chave utilizada no localStorage
const LOCAL_STORAGE_KEY = 'luana_make_bookings';

document.addEventListener('DOMContentLoaded', () => {
    // Referências dos Elementos
    const serviceCards = document.querySelectorAll('.service-card');
    const selectedServiceInput = document.getElementById('selected-service');
    const nameInput = document.getElementById('name');
    const dateInput = document.getElementById('date');
    const timeSelect = document.getElementById('time');
    const notesInput = document.getElementById('notes');
    const bookingForm = document.getElementById('booking-form');
    const resetBtn = document.getElementById('reset-bookings-btn');
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toast-message');

    // Configurar a data mínima do input date para "hoje" (ajustado para fuso horário local)
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const formattedToday = `${year}-${month}-${day}`;
    dateInput.setAttribute('min', formattedToday);

    // 1. Seleção de Serviços
    serviceCards.forEach(card => {
        // Suporte a clique e foco (acessibilidade via teclado)
        card.addEventListener('click', () => selectService(card));
        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                selectService(card);
            }
        });
    });

    function selectService(card) {
        // Remove seleção dos outros cards
        serviceCards.forEach(c => c.classList.remove('selected'));
        
        // Adiciona seleção ao card clicado
        card.classList.add('selected');
        
        // Atualiza o input oculto
        const serviceName = card.getAttribute('data-service');
        selectedServiceInput.value = serviceName;
        
        // Remove estilo de erro se houver
        selectedServiceInput.classList.remove('error');
    }

    // 2. Ouvinte de alteração da Data -> Atualiza os horários disponíveis
    dateInput.addEventListener('change', () => {
        const selectedDate = dateInput.value;
        if (!selectedDate) {
            disableTimeSelect();
            return;
        }

        dateInput.classList.remove('error');
        updateAvailableHours(selectedDate);
    });

    // Função para obter agendamentos salvos no localStorage
    function getBookedHours() {
        const data = localStorage.getItem(LOCAL_STORAGE_KEY);
        return data ? JSON.parse(data) : {};
    }

    // Função para salvar agendamentos no localStorage
    function saveBookingLocally(date, time) {
        const bookings = getBookedHours();
        if (!bookings[date]) {
            bookings[date] = [];
        }
        if (!bookings[date].includes(time)) {
            bookings[date].push(time);
        }
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(bookings));
    }

    // Atualiza o dropdown de horários baseado na data selecionada
    function updateAvailableHours(date) {
        const bookings = getBookedHours();
        const bookedForDate = bookings[date] || [];
        
        // Filtra os horários que NÃO estão agendados
        const available = AVAILABLE_HOURS.filter(hour => !bookedForDate.includes(hour));

        // Limpa o select
        timeSelect.innerHTML = '';

        if (available.length === 0) {
            // Caso todos os horários estejam cheios
            const option = document.createElement('option');
            option.value = '';
            option.textContent = 'Sem horários livres para este dia';
            option.disabled = true;
            option.selected = true;
            timeSelect.appendChild(option);
            timeSelect.disabled = true;
        } else {
            // Adiciona opção padrão de instrução
            const defaultOption = document.createElement('option');
            defaultOption.value = '';
            defaultOption.textContent = 'Selecione';
            defaultOption.disabled = true;
            defaultOption.selected = true;
            timeSelect.appendChild(defaultOption);

            // Adiciona horários disponíveis
            available.forEach(hour => {
                const option = document.createElement('option');
                option.value = hour;
                option.textContent = hour;
                timeSelect.appendChild(option);
            });
            
            timeSelect.disabled = false;
        }
        timeSelect.classList.remove('error');
    }

    function disableTimeSelect() {
        timeSelect.innerHTML = '<option value="" disabled selected>Selecione uma data</option>';
        timeSelect.disabled = true;
        timeSelect.classList.remove('error');
    }

    // Limpa os estados de erro nos inputs ao digitar/selecionar
    nameInput.addEventListener('input', () => nameInput.classList.remove('error'));
    timeSelect.addEventListener('change', () => timeSelect.classList.remove('error'));

    // 3. Validação e Envio do Formulário
    bookingForm.addEventListener('submit', (e) => {
        e.preventDefault();

        // Validação dos dados
        let isValid = true;

        // Validar serviço
        if (!selectedServiceInput.value) {
            showToast('Por favor, escolha um serviço acima.');
            isValid = false;
            // Destaca os cards piscando a borda dourada
            serviceCards.forEach(c => {
                c.style.borderColor = '#ff4d4d';
                setTimeout(() => {
                    if (!c.classList.contains('selected')) {
                        c.style.borderColor = 'var(--color-border)';
                    } else {
                        c.style.borderColor = 'var(--color-border-active)';
                    }
                }, 1500);
            });
        }

        // Validar nome
        if (!nameInput.value.trim()) {
            nameInput.classList.add('error');
            isValid = false;
        }

        // Validar data
        if (!dateInput.value) {
            dateInput.classList.add('error');
            isValid = false;
        }

        // Validar horário
        if (!timeSelect.value) {
            timeSelect.classList.add('error');
            isValid = false;
        }

        if (!isValid) {
            return;
        }

        // Dados validados
        const service = selectedServiceInput.value;
        const name = nameInput.value.trim();
        const date = dateInput.value;
        const time = timeSelect.value;
        const notes = notesInput.value.trim() || 'Nenhuma';

        // Salvar horário agendado no localStorage
        saveBookingLocally(date, time);

        // Formatar data para DD/MM/AAAA
        const dateParts = date.split('-');
        const formattedDate = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;

        // Construir a mensagem formatada para o WhatsApp
        const message = 
`Olá, Luana! Gostaria de realizar um agendamento:

✨ *Serviço:* ${service}
👤 *Nome:* ${name}
📅 *Data:* ${formattedDate}
⏰ *Horário:* ${time}
📝 *Observações:* ${notes}

_Agendado via site_`;

        // URL encode da mensagem
        const encodedMessage = encodeURIComponent(message);
        
        // Criar link do WhatsApp
        const whatsappUrl = `https://wa.me/${WHATSAPP_PHONE}?text=${encodedMessage}`;

        showToast('Agendamento pré-confirmado! Redirecionando...');

        // Pequeno atraso para a animação do Toast e gravação no localStorage
        setTimeout(() => {
            // Abrir WhatsApp em nova aba/janela
            window.open(whatsappUrl, '_blank');
            
            // Limpa formulário e atualiza horários
            nameInput.value = '';
            notesInput.value = '';
            serviceCards.forEach(c => c.classList.remove('selected'));
            selectedServiceInput.value = '';
            dateInput.value = '';
            disableTimeSelect();
        }, 1500);
    });

    // 4. Função para Resetar Agendamentos (para fins de Testes)
    resetBtn.addEventListener('click', () => {
        if (confirm('Deseja limpar todos os horários agendados? (Isto fará com que todos os horários voltem a ficar disponíveis)')) {
            localStorage.removeItem(LOCAL_STORAGE_KEY);
            showToast('Histórico de agendamentos limpo com sucesso!');
            
            // Se houver uma data selecionada, atualiza o dropdown
            if (dateInput.value) {
                updateAvailableHours(dateInput.value);
            } else {
                disableTimeSelect();
            }
        }
    });

    // Função auxiliar para exibir Notificações Toast
    function showToast(msg) {
        toastMessage.textContent = msg;
        toast.classList.add('show');
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }
});
