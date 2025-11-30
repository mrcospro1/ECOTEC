// wizard.js - versión completa y final

// ===============================
// Variables y Configuración
// ===============================
// Asegúrate de que window.ENV.HOST esté definido en tu config.js
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
    
    // Traducir el booleano guardado a texto para mostrar
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
        
        // Inicializacion: dejar el primer panel visible y ajustar altura
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
        // Usamos scrollHeight para obtener la altura real de todo el contenido, incluyendo el padding/margin internos.
        return p ? `${p.scrollHeight}px` : '0px'; 
    }

    updatePanelsContainerHeight() {
        // Usamos requestAnimationFrame para asegurar que el DOM esté renderizado antes de medir
        window.requestAnimationFrame(() => {
            if (this.panelsContainer) {
                this.panelsContainer.style.height = this.getCurrentPanelHeight();
            }
        });
    }

    // Actualiza clases para animación entre panels
    updatePanelsPosition(currentStep) {
        const panels = this.panels;
        const prevStep = panels.findIndex(panel => panel.classList.contains('movingIn'));

        // Limpiar clases de animación
        panels.forEach(panel => panel.classList.remove('movingIn', 'movingOutBackward', 'movingOutFoward'));

        // Asegurar que el panel actual entre
        if (panels[currentStep]) {
            panels[currentStep].classList.add('movingIn');
        }

        // Si había un panel anterior distinto, marcar su salida según dirección
        if (prevStep !== -1 && prevStep !== currentStep) {
            if (currentStep > prevStep) {
                panels[prevStep].classList.add('movingOutFoward');
            } else {
                panels[prevStep].classList.add('movingOutBackward');
            }
        }

        this.updatePanelsContainerHeight(); // Llama a la actualización de altura tras la animación
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

        // bind de métodos para mantener el contexto 'this'
        this.previousControlMoveStepMethod = this.moveStep.bind(this, -1);
        this.nextControlMoveStepMethod = this.moveStep.bind(this, 1);
        this.concludeControlMoveStepMethod = this.handleConcludeStep.bind(this);
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
        // Inicialmente, solo escuchamos el avance normal
        nextControl.addEventListener('click', this.nextControlMoveStepMethod);

        this.updateButtonsStatus();
    }

    updateButtonsStatus() {
        // Desactivar "Anterior" en el primer panel
        if (this.currentStep === 0) {
            this.previousControl.setAttribute('disabled', 'true');
        } else {
            this.previousControl.removeAttribute('disabled');
        }
    }

    // Maneja el texto y los listeners del botón "Siguiente" / "Confirmar"
    handleNextStepButton() {
        const currentPanelID = this.panels.panels[this.currentStep]?.id || '';
        const isSummaryPanel = currentPanelID === 'panel-resultado-final';

        // Limpiar listeners previos para evitar duplicados
        this.nextControl.removeEventListener('click', this.nextControlMoveStepMethod);
        this.nextControl.removeEventListener('click', this.wizardConclusionMethod);

        if (isSummaryPanel) {
            this.nextControl.innerHTML = 'Confirmar!';
            // Al hacer click, ejecuta la lógica de conclusión
            this.nextControl.addEventListener('click', this.wizardConclusionMethod);
        } else {
            this.nextControl.innerHTML = 'Siguiente';
            this.nextControl.addEventListener('click', this.nextControlMoveStepMethod);
        }
    }

    // Se ejecuta al confirmar (marcar paso concluido - compatibilidad)
    handleConcludeStep() {
        this.steps.completeAll();
    }

    // Llama al backend y muestra el resultado
    handleWizardConclusion() {
        this.nextControl.setAttribute('disabled', 'true'); // Desactivar botón mientras carga

        // Recolectar datos del wizard
        const data = this.collectFormData();
        
        // Marcar todos los pasos como completados
        this.steps.completeAll();
        
        const calculoRuta = "/presupuesto-termotanques/calculo"
        
        // Mensaje de carga
        document.getElementById("resultado-resumen").innerHTML = `<p class="text-info">Calculando presupuesto, espere por favor...</p>`;
        this.panels.updatePanelsContainerHeight(); 

        // Enviar al servidor Node
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
                // Ajustar altura del panel final después de cargar el contenido
                this.panels.updatePanelsContainerHeight(); 
            })
            .catch(err => {
                console.error('Error al enviar los datos:', err);
                document.getElementById("resultado-resumen").innerHTML = `<p class="text-danger">Error: No se pudo conectar con el servidor o el cálculo falló. ${err.message}</p>`;
                this.panels.updatePanelsContainerHeight();
            })
            .finally(() => {
                this.nextControl.removeAttribute('disabled'); // Reactivar botón
            });
    }

    // Actualiza el estado cuando avanzás o retrocedes por índices (suma o resta 1)
    updateCurrentStepByIndex(newIndex) {
        if (newIndex < 0 || newIndex >= this.panels.panels.length) return;
        this.currentStep = newIndex;
        this.steps.setCurrentStep(this.currentStep);
        this.panels.setCurrentStep(this.currentStep);
        this.steps.updateVisual(this.panels.panels[this.currentStep].id);
        this.handleNextStepButton();
        this.updateButtonsStatus();
    }

    // movement: -1 (atrás) o 1 (adelante con branching)
    moveStep(movement) {
        // RETROCEDER: simplemente disminuye índice si es posible
        if (movement < 0) {
            if (this.currentStep > 0) {
                this.updateCurrentStepByIndex(this.currentStep - 1);
            }
            return;
        }

        // AVANZAR (ramificado)
        const currentPanelElement = this.panels.panels[this.currentStep];
        if (!currentPanelElement) return;
        const currentPanelID = currentPanelElement.id;
        let nextPanelID = null;

        // 1) Validación del formulario del panel actual (si existe)
        const currentForm = currentPanelElement.querySelector('form');
        if (currentForm && !currentForm.checkValidity()) {
            alert('Por favor, completa los campos requeridos.');
            currentForm.reportValidity();
            return;
        }

        // Si ya estamos en el resumen final y pulsamos Siguiente (que es Confirmar)
        if (currentPanelID === 'panel-resultado-final') {
            // Este caso es manejado por handleWizardConclusion, pero prevenimos un doble avance
            return;
        }
        
        // 2) Lógica ramificada según el panel actual
        if (currentPanelID === 'panel-personas') {
            nextPanelID = 'panel-agua';
        } else if (currentPanelID === 'panel-agua') {
            // Buscar la opción seleccionada y su target
            const selectedOption = currentPanelElement.querySelector('input[name="agua"]:checked');
            if (!selectedOption) {
                alert('Por favor, selecciona una opción de agua.');
                return;
            }
            // Usa el data-target-panel definido en el HTML (manejando el salto de altura para 'red')
            // Busca el data-target-panel en el contenedor padre del input, que es donde lo pusimos.
            nextPanelID = selectedOption.closest('[data-target-panel]')?.dataset.targetPanel;
            if (!nextPanelID) {
                console.error('No se encontró data-target-panel para la opción seleccionada.');
                return;
            }
        } else if (currentPanelID === 'panel-tanque-altura') {
            nextPanelID = 'panel-atmosferico-auto'; // Después de Altura, siempre vamos a Automatización Atmosférica
        } else if (currentPanelID === 'panel-presurizado-auto' || currentPanelID === 'panel-atmosferico-auto') {
            // Ambos flujos de automatización van al resumen final
            nextPanelID = 'panel-resultado-final';
        }
        
        // Si el siguiente panel es el resumen final, previsualizamos los datos ANTES de navegar
        if (nextPanelID === 'panel-resultado-final') {
            this.updateResumen();
        }

        // 3) Si determinamos nextPanelID, ubicamos su índice en panels y navegamos
        if (nextPanelID) {
            const panelsArray = this.panels.panels;
            const newStepIndex = panelsArray.findIndex(panel => panel.id === nextPanelID);

            if (newStepIndex !== -1) {
                this.currentStep = newStepIndex;
                this.steps.setCurrentStep(this.currentStep);
                this.panels.setCurrentStep(this.currentStep);
                this.steps.updateVisual(this.panels.panels[this.currentStep].id);
                this.handleNextStepButton();
                this.updateButtonsStatus();
            } else {
                console.warn(`No se encontró el panel con id "${nextPanelID}"`);
            }
        } else {
            console.warn(`No hay regla de navegación para el panel "${currentPanelID}"`);
        }
    }
    
    // ===============================
    // Captura y muestra de datos
    // ===============================
    collectFormData() {
        const personas = document.querySelector('#form-personas input[name="personas"]')?.value || '';
        const agua = document.querySelector('#form-agua input[name="agua"]:checked')?.value || '';
        
        // Buscar automatizado en AMBOS formularios (solo uno estará marcado)
        let automatizado = document.querySelector('#form-presurizado-auto input[name="automatizado"]:checked')?.value;
        if (!automatizado) {
            automatizado = document.querySelector('#form-atmosferico-auto input[name="automatizado"]:checked')?.value;
        }
        // Convertir 'si'/'no' a booleano, o cadena vacía si no se encontró
        automatizado = automatizado === 'si' ? true : (automatizado === 'no' ? false : '');

        // Altura: si el formulario de altura no fue visitado, se envía '0'.
        const altura = document.querySelector('#form-altura input[name="altura"]')?.value || '0'; 
        
        return { personas, agua, automatizado, altura: parseFloat(altura) };
    }

    updateResumen() {
        const data = this.collectFormData(); 

        // Traducir 'agua' a un texto legible para el usuario
        let tipoAguaTexto = data.agua;
        if (data.agua === 'tanque') tipoAguaTexto = 'Tanque (Atmosférico)';
        else if (data.agua === 'red') tipoAguaTexto = 'Red de Agua (Atmosférico)';
        else if (data.agua === 'bomba') tipoAguaTexto = 'Bomba Presurizadora (Presurizado)';

        // Traducir 'automatizado' a un texto legible
        const automatizadoTexto = data.automatizado === true ? 'Sí' : (data.automatizado === false ? 'No' : '-');
        
        // Obtener el contenedor para la previsualización
        const resumenContainer = document.querySelector('#panel-resultado-final .resumen-preliminar-container');
        if (!resumenContainer) return;
        
        let contenidoHTML;

        // Se usa data.agua para determinar si el campo de Altura debe aparecer en el resumen preliminar
        if (data.agua === 'bomba') {
            // Resumen para flujo Presurizado
            contenidoHTML = `
                <h5 class="mb-3 fw-bold">Configuración Presurizada</h5>
                <ul>
                    <li><strong>Personas:</strong> ${data.personas || '-'}</li>
                    <li><strong>Tipo:</strong> ${tipoAguaTexto}</li>
                    <li><strong>Automatizado:</strong> ${automatizadoTexto}</li>
                </ul>
            `;
        } else {
            // Resumen para flujo Atmosférico/Red
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
        
        // Mostrar el resumen preliminar
        resumenContainer.innerHTML = contenidoHTML;
        
        // Limpiar el resultado final (por si el usuario retrocedió)
        document.getElementById('resultado-resumen').innerHTML = `<p class="text-muted">Presiona **Confirmar** para obtener el cálculo final.</p>`;
        
        this.panels.updatePanelsContainerHeight(); // Asegura que la altura se ajuste al nuevo contenido
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

    // Crear instancia del Wizard
    const wizard = new Wizard(wizardElement);

    // Respeta re-dimension cuando cambie tamaño de la ventana
    window.addEventListener('resize', () => wizard.panels.updatePanelsContainerHeight());
});