// wizard.js - versión completa y corregida
// IMPORTANTE: Asegúrate de tener la variable window.ENV.HOST definida en config.js

// ===============================
// Clase Steps (indicadores arriba)
// ===============================
// Usar una variable segura para el host
const hostUrl = window.ENV ? window.ENV.HOST : 'http://localhost:3000/calculo'; 

class Steps {
    constructor(wizard) {
        this.wizard = wizard;
        this.steps = Array.from(this.getSteps());
        this.stepsQuantity = this.steps.length;
        this.currentStep = 0;
    }

    getSteps() {
        return this.wizard.getElementsByClassName('step');
    }

    setCurrentStep(currentStep) {
        this.currentStep = currentStep;
    }

    // Convierte un panelId en el índice lógico del step (0..3)
    panelIdToLogicalIndex(panelId) {
        if (panelId === 'panel-personas') return 0;
        if (panelId === 'panel-agua') return 1;
        // Todos los paneles de "automtización" y altura cuentan como paso lógico 2
        if (
            panelId === 'panel-presurizado-auto' ||
            panelId === 'panel-tanque-altura' ||
            panelId === 'panel-atmosferico-auto'
        ) return 2;
        // Cualquier resumen -> paso lógico 3
        if (panelId && panelId.startsWith('panel-resultado-final')) return 3;
        
        return 0;
    }

    updateStepsState(panelId) {
        const logicalIndex = this.panelIdToLogicalIndex(panelId);
        this.setCurrentStep(logicalIndex);

        this.steps.forEach((step, index) => {
            step.classList.remove('-completed');
            step.classList.remove('-active');

            if (index < logicalIndex) {
                step.classList.add('-completed');
            } else if (index === logicalIndex) {
                step.classList.add('-active');
            }
        });
    }

    // Marca todos los pasos como completados para la vista de resumen final
    completeAllSteps() {
        this.steps.forEach(step => {
            step.classList.remove('-active');
            step.classList.add('-completed');
        });
    }
}

// ===============================
// Clase Panels (contenedores de contenido)
// ===============================
class Panels {
    constructor(wizard) {
        this.wizard = wizard;
        this.panelsContainer = this.wizard.wizardElement.querySelector('.panels');
        // Asegúrate de que los paneles sean los hijos del contenedor con la clase .panel
        this.panels = Array.from(this.panelsContainer.querySelectorAll('.panel')); 
        this.currentStep = 0;
        
        // Inicializa la altura al tamaño del primer panel
        this.updatePanelsContainerHeight(); 
    }

    setCurrentStep(index) {
        if (index >= 0 && index < this.panels.length) {
            this.currentStep = index;
            return true;
        }
        return false;
    }

    getCurrentPanelHeight() {
        const p = this.panels[this.currentStep];
        // Usar scrollHeight para asegurar que se toma la altura completa del contenido
        return p ? `${p.scrollHeight}px` : '0px'; 
    }

    updatePanelsContainerHeight() {
        window.requestAnimationFrame(() => {
            if (this.panelsContainer) {
                this.panelsContainer.style.height = this.getCurrentPanelHeight();
            }
        });
    }
    
    updatePanelsPosition(currentStep) {
        const panelsWidth = 100 / this.panels.length;
        const offset = -currentStep * panelsWidth;

        this.panelsContainer.style.transform = `translateX(${offset}%)`;

        // Transiciones de entrada/salida para el panel actual y el anterior
        this.panels.forEach((panel, index) => {
            panel.classList.remove('movingIn', 'movingOut');
            // Usamos un pequeño truco para la clase 'movingOut'
            if (index === currentStep) {
                panel.classList.add('movingIn');
            } else if (index === this.wizard.currentStepHistory[this.wizard.currentStepHistory.length - 2]) {
                panel.classList.add('movingOut');
            }
        });

        // Llamar a la actualización de altura después de la transición
        this.updatePanelsContainerHeight();
    }
}

// ===============================
// Clase Wizard (lógica principal)
// ===============================
class Wizard {
    // 🔑 CORRECCIÓN: Ahora acepta los botones como parámetros
    constructor(wizardElement, nextButton, prevButton) { 
        this.wizardElement = wizardElement;
        this.steps = new Steps(wizardElement);
        this.panels = new Panels(this); 
        this.currentStep = 0; 
        this.currentPanelId = this.panels.panels[0].id; 
        this.currentStepHistory = [0]; 
        
        // 🔑 Guardar las referencias a los botones (para evitar el error de null)
        this.nextButton = nextButton;
        this.prevButton = prevButton; 
        
        this.handleInitialState();

        // Llamada corregida
        this.panels.updatePanelsPosition(this.currentStep);
    }

    handleInitialState() {
        this.updateButtons();
        this.steps.updateStepsState(this.currentPanelId);
    }

    updateButtons() {
        const nextButton = this.nextButton;
        const prevButton = this.prevButton;
        
        // 🔑 Solución al TypeError: prevButton no puede ser null aquí
        if (prevButton) {
            // El botón 'Anterior' se oculta en el primer paso (lógico)
            prevButton.style.display = (this.steps.currentStep === 0) ? 'none' : 'block';
        }

        if (nextButton) {
            // El botón 'Siguiente' cambia de texto en el paso de resumen
            if (this.currentPanelId === 'panel-resultado-final') {
                nextButton.textContent = 'Confirmar';
            } else {
                nextButton.textContent = 'Siguiente';
            }
        }
    }
    
    // Recoge datos de todos los formularios
    collectFormData() {
        const data = {};
        const forms = this.wizardElement.querySelectorAll('form');
        
        forms.forEach(form => {
            const formData = new FormData(form);
            for (let [key, value] of formData.entries()) {
                if (key === 'automatizado') {
                    data[key] = (value === 'si'); // Convertir 'si'/'no' a booleano
                } else if (value !== '') {
                    data[key] = value;
                }
            }
        });
        
        // Asegura que 'altura' tenga un valor si se saltó el panel
        if (data.agua === 'red' || data.agua === 'bomba') {
            data.altura = data.altura || 0;
        }

        return data;
    }

    // Actualiza el resumen preliminar
    updateResumen() {
        const data = this.collectFormData(); 

        // Traducir 'agua' a un texto legible para el usuario
        let tipoAguaTexto = data.agua;
        if (data.agua === 'tanque') tipoAguaTexto = 'Tanque (Atmosférico)';
        else if (data.agua === 'red') tipoAguaTexto = 'Red (Atmosférico)';
        else if (data.agua === 'bomba') tipoAguaTexto = 'Bomba (Presurizado)';

        // Traducir 'automatizado' a un texto legible
        const automatizadoTexto = data.automatizado === true ? 'Sí (Incluye Control TK-8)' : (data.automatizado === false ? 'No' : '-');
        
        // Obtener el panel donde se muestra el resumen preliminar
        const resumenPanel = document.getElementById('panel-resultado-final'); 
        if (!resumenPanel) return;
        
        // Mostrar el resumen preliminar
        let contenidoHTML;

        if (data.agua === 'bomba') {
            // Resumen para flujo Presurizado
            contenidoHTML = `
                <h5 class="mb-3 fw-bold">Configuración Presurizada</h5>
                <ul>
                    <li><strong>Personas:</strong> ${data.personas || '-'}</li>
                    <li><strong>Tipo de Agua:</strong> ${tipoAguaTexto}</li>
                    <li><strong>Automatizado:</strong> ${automatizadoTexto}</li>
                </ul>
            `;
        } else {
            // Resumen para flujo Atmosférico/Red/Tanque
            // Solo mostramos la altura si se seleccionó Tanque, de lo contrario 'N/A'.
            const alturaDisplay = data.agua === 'tanque' && data.altura > 0 ? `${data.altura} m` : 'No aplica (Red o Altura Suficiente)';

            contenidoHTML = `
                <h5 class="mb-3 fw-bold">Configuración Atmosférica</h5>
                <ul>
                    <li><strong>Personas:</strong> ${data.personas || '-'}</li>
                    <li><strong>Tipo de Agua:</strong> ${tipoAguaTexto}</li>
                    <li><strong>Altura tanque:</strong> ${alturaDisplay}</li>
                    <li><strong>Automatizado:</strong> ${automatizadoTexto}</li>
                </ul>
            `;
        }
        
        // Limpiar el contenido de resultado-resumen y mostrar el resumen preliminar
        document.getElementById('resultado-resumen').innerHTML = `<p class="text-muted">Presiona **Confirmar** para calcular el presupuesto.</p>`;
        resumenPanel.querySelector('.resumen-preliminar-container').innerHTML = contenidoHTML;
    }
    
    // Llama al API, recibe el resultado y lo muestra
    async handleWizardConclusion() {
        const finalData = this.collectFormData();
        const resultadoDiv = document.getElementById('resultado-resumen');
        
        resultadoDiv.innerHTML = `<p class="text-center text-primary fw-bold">Calculando presupuesto...</p>`;

        try {
            const response = await fetch(hostUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(finalData)
            });

            if (!response.ok) {
                throw new Error(`Error en el servidor: ${response.statusText}`);
            }

            const result = await response.json();
            
            // Construir la tabla de accesorios
            let accesoriosHtml = '<tr><td colspan="2" class="text-muted text-start">Ningún accesorio adicional requerido.</td></tr>';
            if (result.accesorios && result.accesorios.length > 0) {
                accesoriosHtml = result.accesorios.map(acc => `
                    <tr>
                        <td class="text-start">${acc.nombre}</td>
                        <td class="text-end">$${acc.precio.toLocaleString('es-AR')}</td>
                    </tr>
                `).join('');
            }
            
            // Mostrar resultado final
            resultadoDiv.innerHTML = `
                <h5 class="text-center fw-bold">Modelo Sugerido: ${result.modelo}</h5>
                <p class="text-center mb-4">Precio Base: $${result.precioBase.toLocaleString('es-AR')}</p>

                <table class="table table-sm table-striped">
                    <thead>
                        <tr>
                            <th colspan="2" class="text-center">Accesorios</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${accesoriosHtml}
                    </tbody>
                    <tfoot>
                        <tr>
                            <td class="fw-bold text-start">Subtotal Accesorios:</td>
                            <td class="fw-bold text-end">$${result.precioAccesorios.toLocaleString('es-AR')}</td>
                        </tr>
                    </tfoot>
                </table>

                <h4 class="text-center mt-4">Precio Final Estimado:</h4>
                <h3 class="text-center text-success fw-bold">$${result.precioFinal.toLocaleString('es-AR')}</h3>
            `;
            
        } catch (error) {
            console.error('Error al calcular presupuesto:', error);
            resultadoDiv.innerHTML = `<p class="text-danger text-center fw-bold">Error al obtener presupuesto. Intente más tarde.</p>`;
        }
    }

    // movement: -1 (atrás) o 1 (adelante con branching)
    moveStep(movement) {
        const currentPanelElement = this.panels.panels[this.currentStep];
        if (!currentPanelElement) return;
        const currentPanelID = currentPanelElement.id;
        let nextPanelID = null;

        // 1) Lógica de Retroceso
        if (movement < 0) {
            if (this.currentStepHistory.length > 1) {
                this.currentStepHistory.pop(); // Elimina el paso actual
                const newStepIndex = this.currentStepHistory[this.currentStepHistory.length - 1]; // Recupera el anterior
                this.currentPanelId = this.panels.panels[newStepIndex].id;
                this.currentStep = newStepIndex;
                this.panels.setCurrentStep(this.currentStep);
                this.panels.updatePanelsPosition(this.currentStep);
                this.steps.updateStepsState(this.currentPanelId);
                this.updateButtons();
            }
            return;
        }

        // 2) Lógica de Avance
        
        // Validación del formulario del panel actual (si existe)
        const currentForm = currentPanelElement.querySelector('form');
        if (currentForm && !currentForm.checkValidity()) {
            alert('Por favor, completa los campos requeridos.');
            currentForm.reportValidity();
            return;
        }

        // Lógica ramificada (Branching)
        if (currentPanelID === 'panel-personas') {
            nextPanelID = 'panel-agua';
        } else if (currentPanelID === 'panel-agua') {
            const selectedOption = currentPanelElement.querySelector('input[name="agua"]:checked');
            if (!selectedOption) return; 
            
            // Obtener el data-target-panel
            nextPanelID = selectedOption.closest('[data-target-panel]')?.dataset.targetPanel;
            
        } else if (currentPanelID === 'panel-tanque-altura') {
            // Flujo Tanque: Altura -> Atmosférico Auto
            nextPanelID = 'panel-atmosferico-auto';
        } else if (currentPanelID === 'panel-presurizado-auto' || currentPanelID === 'panel-atmosferico-auto') {
            // Flujo Presurizado o Atmosférico: Auto -> Resumen Final
            nextPanelID = 'panel-resultado-final'; 
        } 
        
        // Caso final: Estamos en el resumen y presionamos "Confirmar"
        if (currentPanelID === 'panel-resultado-final') {
            this.steps.completeAllSteps(); // Estética final
            this.handleWizardConclusion(); // Llama al API
            return;
        }

        // 3) Navegar al siguiente panel
        if (nextPanelID) {
            const nextPanelIndex = this.panels.panels.findIndex(p => p.id === nextPanelID);
            
            if (nextPanelIndex !== -1) {
                // Si el siguiente panel es el resumen final, primero actualizamos el contenido visual
                if (nextPanelID === 'panel-resultado-final') {
                    this.updateResumen();
                }

                this.currentStep = nextPanelIndex;
                this.currentPanelId = nextPanelID;
                this.panels.setCurrentStep(this.currentStep);
                this.panels.updatePanelsPosition(this.currentStep);
                this.steps.updateStepsState(this.currentPanelId);
                this.currentStepHistory.push(this.currentStep); // Guarda el nuevo paso en el historial
                this.updateButtons();
            } else {
                console.error(`No se encontró el panel con id "${nextPanelID}"`);
            }
        }
    }
}

// ===============================
// Inicialización
// ===============================
document.addEventListener('DOMContentLoaded', () => {
    const wizardElement = document.getElementById('wizard');
    const controlsContainer = wizardElement ? wizardElement.nextElementSibling : null; // Asume que .controls está justo después de #wizard

    if (wizardElement && controlsContainer && controlsContainer.classList.contains('controls')) {
        
        // 🔑 Solución al error de TypeError: Seleccionar los botones fuera del #wizard
        const nextButton = controlsContainer.querySelector('.next');
        const prevButton = controlsContainer.querySelector('.previous');

        // 🔑 Pasar los botones al constructor del Wizard
        const wizard = new Wizard(wizardElement, nextButton, prevButton); 

        if (nextButton) {
            nextButton.addEventListener('click', () => wizard.moveStep(1));
        }

        if (prevButton) {
            prevButton.addEventListener('click', () => wizard.moveStep(-1));
        }

        // Manejo de resize para la altura dinámica
        window.addEventListener('resize', () => wizard.panels.updatePanelsContainerHeight());

    } else {
        console.error('Elemento #wizard o contenedor .controls no encontrado.');
    }
});
