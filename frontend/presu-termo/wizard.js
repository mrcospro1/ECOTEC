// wizard.js - versión COMPLETA Y FINAL con Historial de Navegación (Stack)

// ===============================
// Variables y Configuración
// ===============================
const hostUrl = window.ENV.HOST; 

// ===============================
// Clase Steps (indicadores arriba)
// ===============================
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
        // El resumen final -> paso lógico 3
        if (panelId === 'panel-resultado-final') return 3;
        return 0;
    }

    // Marca los pasos 0..logicalIndex como completados y apaga los siguientes
    updateVisual(panelId) {
        const logicalIndex = this.panelIdToLogicalIndex(panelId);
        this.steps.forEach((stepEl, idx) => {
            if (idx <= logicalIndex) {
                stepEl.classList.add('-completed');
            } else {
                stepEl.classList.remove('-completed');
            }
        });
    }

    // Enciende todos los steps (usado al confirmar)
    completeAll() {
        this.steps.forEach(stepEl => stepEl.classList.add('-completed'));
    }
}

// ===============================
// Función para mostrar el resultado final
// ===============================
function mostrarResumen(datos) {
    const cont = document.getElementById("resultado-resumen");
    
    const automatizadoTexto = datos.datosGuardados.automatizado ? "Sí" : "No";
    const alturaM = datos.datosGuardados.altura > 0 ? `${datos.datosGuardados.altura} m` : 'No aplica';

    cont.innerHTML = `
        <h5 class="mb-3 fw-bold text-success">${datos.modelo}</h5>

        <p><strong>Precio base:</strong> $${datos.precioBase.toLocaleString('es-AR')}</p>

        <p><strong>Accesorios:</strong></p>
        <ul class="list-unstyled">
            ${datos.accesorios.map(a => `
                <li>&bull; ${a.nombre}: $${a.precio.toLocaleString('es-AR')}</li>
            `).join("")}
        </ul>

        <p><strong>Precio accesorios:</strong> $${datos.precioAccesorios.toLocaleString('es-AR')}</p>
        <h4 class="mt-4"><strong>Total final:</strong> <span class="fw-bold text-primary">$${datos.precioFinal.toLocaleString('es-AR')}</span></h4>

        <hr>

        <p class="text-muted small-text">Detalles de la configuración:</p>
        <ul class="list-unstyled small-text">
            <li><strong>Personas:</strong> ${datos.datosGuardados.personas}</li>
            <li><strong>Tipo de agua:</strong> ${datos.datosGuardados.agua}</li>
            <li><strong>Automatizado:</strong> ${automatizadoTexto}</li>
            <li><strong>Altura:</strong> ${alturaM}</li>
        </ul>
    `;
}

// ===============================
// Clase Panels (control de panels y animaciones + ALTURA DINÁMICA)
// ===============================
class Panels {
    constructor(wizard) {
        this.wizard = wizard;
        this.panelsContainer = this.getPanelsContainer();
        this.panels = this.getPanels();
        this.currentStep = 0;
        
        this.updatePanelsPosition(this.currentStep);
        this.updatePanelsContainerHeight(); 
    }

    getPanelsContainer() {
        return this.wizard.querySelector('.panels');
    }

    getPanels() {
        return Array.from(this.wizard.getElementsByClassName('panel'));
    }

    getCurrentPanelHeight() {
        const p = this.panels[this.currentStep];
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
        const panels = this.panels;
        const prevStep = panels.findIndex(panel => panel.classList.contains('movingIn'));

        panels.forEach(panel => panel.classList.remove('movingIn', 'movingOutBackward', 'movingOutFoward'));

        if (panels[currentStep]) {
            panels[currentStep].classList.add('movingIn');
        }

        if (prevStep !== -1 && prevStep !== currentStep) {
            if (currentStep > prevStep) {
                panels[prevStep].classList.add('movingOutFoward');
            } else {
                panels[prevStep].classList.add('movingOutBackward');
            }
        }

        this.updatePanelsContainerHeight(); 
    }

    setCurrentStep(currentStep) {
        if (currentStep < 0 || currentStep >= this.panels.length) return;
        this.currentStep = currentStep;
        this.updatePanelsPosition(currentStep);
    }
}

// ===============================
// Clase Wizard (lógica principal)
// ===============================
class Wizard {
    constructor(wizardElement) {
        this.wizard = wizardElement;
        this.panels = new Panels(this.wizard);
        this.steps = new Steps(this.wizard);

        this.previousControl = document.querySelector('.previous');
        this.nextControl = document.querySelector('.next');

        // Pila para historial de navegación ramificada. ¡CLAVE PARA EL BOTÓN ANTERIOR!
        this.historyStack = []; 

        this.previousControlMoveStepMethod = this.moveStep.bind(this, -1);
        this.nextControlMoveStepMethod = this.moveStep.bind(this, 1);
        this.wizardConclusionMethod = this.handleWizardConclusion.bind(this);

        this.currentStep = 0;
        this.steps.setCurrentStep(this.currentStep);
        this.panels.setCurrentStep(this.currentStep);

        this.addControls(this.previousControl, this.nextControl);

        this.steps.updateVisual(this.panels.panels[this.currentStep].id);
        this.handleNextStepButton();
        this.updateButtonsStatus();
    }

    addControls(previousControl, nextControl) {
        this.previousControl = previousControl;
        this.nextControl = nextControl;

        previousControl.addEventListener('click', this.previousControlMoveStepMethod);
        nextControl.addEventListener('click', this.nextControlMoveStepMethod);

        this.updateButtonsStatus();
    }

    updateButtonsStatus() {
        // Desactivar "Anterior" si el historial de navegación está vacío o estamos en el primer paso
        if (this.historyStack.length === 0) {
            this.previousControl.setAttribute('disabled', 'true');
        } else {
            this.previousControl.removeAttribute('disabled');
        }
    }

    handleNextStepButton() {
        const currentPanelID = this.panels.panels[this.currentStep]?.id || '';
        const isSummaryPanel = currentPanelID === 'panel-resultado-final';

        this.nextControl.removeEventListener('click', this.nextControlMoveStepMethod);
        this.nextControl.removeEventListener('click', this.wizardConclusionMethod);

        if (isSummaryPanel) {
            this.nextControl.innerHTML = 'Confirmar!';
            this.nextControl.addEventListener('click', this.wizardConclusionMethod);
        } else {
            this.nextControl.innerHTML = 'Siguiente';
            this.nextControl.addEventListener('click', this.nextControlMoveStepMethod);
        }
    }

    handleWizardConclusion() {
        this.nextControl.setAttribute('disabled', 'true'); 

        const data = this.collectFormData();
        
        this.steps.completeAll();
        
        const calculoRuta = "/presupuesto-termotanques/calculo"
        
        document.getElementById("resultado-resumen").innerHTML = `<p class="text-info">Calculando presupuesto, espere por favor...</p>`;
        this.panels.updatePanelsContainerHeight(); 

        fetch(`${hostUrl}${calculoRuta}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        })
            .then(res => {
                 if (!res.ok) {
                    throw new Error(`HTTP error! status: ${res.status}`);
                }
                return res.json();
            })
            .then(data => {
                mostrarResumen(data);
                this.panels.updatePanelsContainerHeight(); 
            })
            .catch(err => {
                console.error('Error al enviar los datos:', err);
                document.getElementById("resultado-resumen").innerHTML = `<p class="text-danger">Error: No se pudo conectar con el servidor o el cálculo falló. ${err.message}</p>`;
                this.panels.updatePanelsContainerHeight();
            })
            .finally(() => {
                this.nextControl.removeAttribute('disabled');
            });
    }

    // Actualiza el estado cuando avanzás o retrocedes por ID de panel
    updateCurrentStepById(newPanelID) {
        const panelsArray = this.panels.panels;
        const newStepIndex = panelsArray.findIndex(panel => panel.id === newPanelID);
        
        if (newStepIndex !== -1) {
            this.currentStep = newStepIndex;
            this.steps.setCurrentStep(this.currentStep);
            this.panels.setCurrentStep(this.currentStep);
            this.steps.updateVisual(this.panels.panels[this.currentStep].id);
            this.handleNextStepButton();
            this.updateButtonsStatus();
            return true;
        } else {
            console.warn(`No se encontró el panel con id "${newPanelID}"`);
            return false;
        }
    }

    // movement: -1 (atrás) o 1 (adelante con branching)
    moveStep(movement) {
        const currentPanelElement = this.panels.panels[this.currentStep];
        if (!currentPanelElement) return;
        const currentPanelID = currentPanelElement.id;
        
        // ======================================
        // RETROCEDER (movement < 0) - Lógica CLAVE
        // ======================================
        if (movement < 0) {
            const previousPanelID = this.historyStack.pop();
            
            if (previousPanelID) {
                this.updateCurrentStepById(previousPanelID);
                this.updateButtonsStatus(); // Actualiza el estado del botón "Anterior"
                if (previousPanelID === 'panel-resultado-final') {
                    this.updateResumen();
                }
            }
            return;
        }

        // ======================================
        // AVANZAR (movement > 0) - Lógica Ramificada
        // ======================================
        let nextPanelID = null;

        // 1) Validación del formulario del panel actual (si existe)
        const currentForm = currentPanelElement.querySelector('form');
        if (currentForm && !currentForm.checkValidity()) {
            alert('Por favor, completa los campos requeridos.');
            currentForm.reportValidity();
            return;
        }

        if (currentPanelID === 'panel-resultado-final') {
            return;
        }
        
        // 2) Lógica ramificada según el panel actual
        if (currentPanelID === 'panel-personas') {
            nextPanelID = 'panel-agua';
        } else if (currentPanelID === 'panel-agua') {
            const selectedOption = currentPanelElement.querySelector('input[name="agua"]:checked');
            if (!selectedOption) {
                alert('Por favor, selecciona una opción de agua.');
                return;
            }
            nextPanelID = selectedOption.closest('[data-target-panel]')?.dataset.targetPanel;
        } else if (currentPanelID === 'panel-tanque-altura') {
            nextPanelID = 'panel-atmosferico-auto'; 
        } else if (currentPanelID === 'panel-presurizado-auto' || currentPanelID === 'panel-atmosferico-auto') {
            nextPanelID = 'panel-resultado-final';
        }
        
        // 3) Si determinamos el siguiente panel, guardamos el actual en el historial y navegamos
        if (nextPanelID) {
            // Guardar el panel actual en el historial antes de avanzar
            this.historyStack.push(currentPanelID);
            
            // Si el siguiente panel es el resumen, previsualizamos los datos
            if (nextPanelID === 'panel-resultado-final') {
                this.updateResumen();
            }

            this.updateCurrentStepById(nextPanelID);
            this.updateButtonsStatus();

        } else {
            console.warn(`No hay regla de navegación o nextPanelID inválido para el panel "${currentPanelID}"`);
        }
    }
    
    // ===============================
    // Captura y muestra de datos
    // ===============================
    collectFormData() {
        const personas = document.querySelector('#form-personas input[name="personas"]')?.value || '';
        const agua = document.querySelector('#form-agua input[name="agua"]:checked')?.value || '';
        
        let automatizado = document.querySelector('#form-presurizado-auto input[name="automatizado"]:checked')?.value;
        if (!automatizado) {
            automatizado = document.querySelector('#form-atmosferico-auto input[name="automatizado"]:checked')?.value;
        }
        automatizado = automatizado === 'si' ? true : (automatizado === 'no' ? false : '');

        const altura = document.querySelector('#form-altura input[name="altura"]')?.value || '0'; 
        
        return { personas, agua, automatizado, altura: parseFloat(altura) };
    }

    updateResumen() {
        const data = this.collectFormData(); 

        let tipoAguaTexto = data.agua;
        if (data.agua === 'tanque') tipoAguaTexto = 'Tanque (Atmosférico)';
        else if (data.agua === 'red') tipoAguaTexto = 'Red de Agua (Atmosférico)';
        else if (data.agua === 'bomba') tipoAguaTexto = 'Bomba Presurizadora (Presurizado)';

        const automatizadoTexto = data.automatizado === true ? 'Sí' : (data.automatizado === false ? 'No' : '-');
        
        const resumenContainer = document.querySelector('#panel-resultado-final .resumen-preliminar-container');
        if (!resumenContainer) return;
        
        let contenidoHTML;

        if (data.agua === 'bomba') {
            contenidoHTML = `
                <h5 class="mb-3 fw-bold">Configuración Presurizada</h5>
                <ul>
                    <li><strong>Personas:</strong> ${data.personas || '-'}</li>
                    <li><strong>Tipo:</strong> ${tipoAguaTexto}</li>
                    <li><strong>Automatizado:</strong> ${automatizadoTexto}</li>
                </ul>
            `;
        } else {
            contenidoHTML = `
                <h5 class="mb-3 fw-bold">Configuración Atmosférica</h5>
                <ul>
                    <li><strong>Personas:</strong> ${data.personas || '-'}</li>
                    <li><strong>Tipo:</strong> ${tipoAguaTexto}</li>
                    ${data.agua === 'tanque' ? `<li><strong>Altura tanque:</strong> ${data.altura || 0} m</li>` : ''}
                    <li><strong>Automatizado:</strong> ${automatizadoTexto}</li>
                </ul>
            `;
        }
        
        resumenContainer.innerHTML = contenidoHTML;
        
        document.getElementById('resultado-resumen').innerHTML = `<p class="text-muted">Presiona **Confirmar** para obtener el cálculo final.</p>`;
        
        this.panels.updatePanelsContainerHeight(); 
    }
}

// ===============================
// INICIALIZACIÓN al DOM cargado
// ===============================
document.addEventListener('DOMContentLoaded', () => {
    const wizardElement = document.getElementById('wizard');
    if (!wizardElement) {
        console.error('No se encontró el elemento #wizard en el DOM.');
        return;
    }

    const wizard = new Wizard(wizardElement);

    window.addEventListener('resize', () => wizard.panels.updatePanelsContainerHeight());
});