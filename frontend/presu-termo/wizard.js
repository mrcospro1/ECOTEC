// wizard.js - versión completa y sin errores

// ===============================
// Clase Steps (indicadores arriba)
// ===============================
const hostUrl = window.ENV.HOST;
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
    // Todos los paneles de "automtización" cuentan como paso lógico 2
    if (
      panelId === 'panel-presurizado-auto' ||
      panelId === 'panel-tanque-altura' ||
      panelId === 'panel-atmosferico-auto'
    ) return 2;
    // Cualquier resumen -> paso lógico 3
    if (panelId && panelId.startsWith('panel-resumen')) return 3;
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
// Clase Panels (control de panels y animaciones)
// ===============================
class Panels {
  constructor(wizard) {
    this.wizard = wizard;
    this.panelsContainer = this.getPanelsContainer();
    this.panels = this.getPanels();
    this.currentStep = 0;
    // Inicializacion: dejar el primer panel visible
    this.updatePanelsPosition(this.currentStep);
    // this.updatePanelsContainerHeight();
  }

  getPanelsContainer() {
    return this.wizard.querySelector('.panels');
  }

  getPanels() {
    return Array.from(this.wizard.getElementsByClassName('panel'));
  }


  //  getCurrentPanelHeight() {
  //    const p = this.panels[this.currentStep];
  //    return p ? `${p.offsetHeight}px` : '0px';
  //  }

  //  updatePanelsContainerHeight() {
  //    if (this.panelsContainer) {
  //      this.panelsContainer.style.height = this.getCurrentPanelHeight();
  //    }
  //  }


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

    //  this.updatePanelsContainerHeight();
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

    // botones existentes en tu HTML
    this.previousControl = document.querySelector('.previous');
    this.nextControl = document.querySelector('.next');

    // bind de métodos
    this.previousControlMoveStepMethod = this.moveStep.bind(this, -1);
    this.nextControlMoveStepMethod = this.moveStep.bind(this, 1);
    this.concludeControlMoveStepMethod = this.handleConcludeStep.bind(this);
    this.wizardConclusionMethod = this.handleWizardConclusion.bind(this);

    // estado inicial - el panel activo es 0
    this.currentStep = 0;
    this.steps.setCurrentStep(this.currentStep);
    this.panels.setCurrentStep(this.currentStep);

    // colocar listeners
    this.addControls(this.previousControl, this.nextControl);

    // estado visual inicial de los steps
    this.steps.updateVisual(this.panels.panels[this.currentStep].id);

    // actualizar botones visibles/estado
    this.handleNextStepButton();
    this.updateButtonsStatus();

    // Respeta re-dimension cuando cambie tamaño (evita que el contenedor quede chico)

    // window.addEventListener('resize', () => this.panels.updatePanelsContainerHeight());
  }

  addControls(previousControl, nextControl) {
    this.previousControl = previousControl;
    this.nextControl = nextControl;

    previousControl.addEventListener('click', this.previousControlMoveStepMethod);
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

  handleNextStepButton() {
    // Si el panel actual es un resumen, el botón mostrará Confirmar y cambiará su comportamiento
    const currentPanelID = this.panels.panels[this.currentStep]?.id || '';
    const isSummaryPanel = currentPanelID.startsWith('panel-resumen');

    // Limpiar listeners previos para evitar duplicados
    this.nextControl.removeEventListener('click', this.nextControlMoveStepMethod);
    this.nextControl.removeEventListener('click', this.concludeControlMoveStepMethod);
    this.nextControl.removeEventListener('click', this.wizardConclusionMethod);

    if (isSummaryPanel) {
      this.nextControl.innerHTML = 'Confirmar!';
      // Al hacer click confirmamos (dos acciones: marcar completado y ejecutar conclusión)
      this.nextControl.addEventListener('click', this.concludeControlMoveStepMethod);
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

  handleWizardConclusion() {    
  this.steps.completeAll();
  this.wizard.classList.add('completed');

  // Recolectar datos del wizard
  const data = this.collectFormData();

  // Enviar al servidor Node
  fetch(`${hostUrl}/presupuesto-termotanques/calculo`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
    .then(res => res.json())
    .then(respuesta => {
      alert(`Presupuesto estimado: ${respuesta.presupuesto}`);
      console.log('Respuesta del servidor:', respuesta);
    })
    .catch(err => {
      console.error('Error al enviar los datos:', err);
      alert('Hubo un error al enviar los datos al servidor.');
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

    // 2) Lógica ramificada según el panel actual (coincide con tu HTML)
    if (currentPanelID === 'panel-personas') {
      nextPanelID = 'panel-agua';
    } else if (currentPanelID === 'panel-agua') {
      // Buscar la opción seleccionada
      const selectedOption = currentPanelElement.querySelector('input[name="agua"]:checked');
      if (!selectedOption) {
        alert('Por favor, selecciona una opción de agua.');
        return;
      }
      // Obtener el data-target-panel desde el contenedor (div.form-check)
      nextPanelID = selectedOption.closest('[data-target-panel]')?.dataset.targetPanel;
      if (!nextPanelID) {
        console.error('No se encontró data-target-panel para la opción seleccionada.');
        return;
      }
    } else if (currentPanelID === 'panel-tanque-altura') {
      nextPanelID = 'panel-atmosferico-auto';
    } else if (currentPanelID === 'panel-presurizado-auto') {
      nextPanelID = 'panel-resumen-presurizado';
    } else if (currentPanelID === 'panel-atmosferico-auto') {
      nextPanelID = 'panel-resumen-atmosferico';
    } else if (currentPanelID.startsWith('panel-resumen')) {
      // Si estamos en un resumen y presionamos siguiente, tratamos como confirmación
      this.handleConcludeStep();
      this.handleWizardConclusion();
      return;
    }
    if (nextPanelID && nextPanelID.startsWith('panel-resumen')) {
  this.updateResumen(nextPanelID);
}

    // 3) Si determinamos nextPanelID, ubicamos su índice en panels y navegamos
    if (nextPanelID) {
      const panelsArray = this.panels.panels;
      const newStepIndex = panelsArray.findIndex(panel => panel.id === nextPanelID);

      if (newStepIndex !== -1) {
        // Actualizar índice y estados
        this.currentStep = newStepIndex;
        this.steps.setCurrentStep(this.currentStep);
        // Marcar lógica de steps (enciende 0..logicalIndex)
        this.steps.updateVisual(this.panels.panels[this.currentStep].id);
        // Mostrar panel correspondiente
        this.panels.setCurrentStep(this.currentStep);

        // Actualizar botones y estado del next
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
    const tipoAgua = document.querySelector('#form-agua input[name="agua"]:checked')?.value || '';
    const altura = document.querySelector('#form-altura input[name="altura"]')?.value || '';
    const automatizado = document.querySelector('input[name="automatizado"]:checked')?.value || '';

    return { personas, tipoAgua, altura, automatizado };
  }

  updateResumen(panelId) {
    const data = this.collectFormData();

    if (panelId === 'panel-resumen-presurizado') {
      const resumenPanel = document.getElementById('panel-resumen-presurizado');
      resumenPanel.querySelector('p').innerText =
        `Personas: ${data.personas || '-'}, Tipo: Presurizado, Automatizado: ${data.automatizado || '-'}`;
    }
    else if (panelId === 'panel-resumen-atmosferico') {
      const resumenPanel = document.getElementById('panel-resumen-atmosferico');
      resumenPanel.querySelector('p').innerText =
        `Personas: ${data.personas || '-'}, Tipo: ${data.tipoAgua === 'tanque' ? 'Atmosférico' : 'Red'}, ` +
        `Altura tanque: ${data.altura || '-'} m, Automatizado: ${data.automatizado || '-'}`;
    }
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

  const personas = document.querySelector('input[name="personas"]').value;
  const agua = document.querySelector('input[name="agua"]:checked')?.value || '';
  const automatizado = document.querySelector('input[name="automatizado"]:checked')?.value || '';
  const altura = document.querySelector('input[name="altura"]')?.value || '';

  const datos = { personas, agua, automatizado, altura };

  // Enviar los datos al servidor
  fetch('http://localhost:3000/presupuesto-termotanques/calculo', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(datos)
  })
    .then(res => res.json())
    .then(data => {
      alert(`Presupuesto estimado: ${data.presupuesto}`);
      console.log('Respuesta del servidor:', data);
    })
    .catch(err => {
      console.error('Error al enviar los datos:', err);
      alert('Hubo un error al enviar los datos.');
    });

  // OPTIONAL: debugging rápido (descomentar para ver el panel actual en la consola)
  // wizardElement.addEventListener('transitionend', () => {
  //   console.log(`Panel activo: ${wizard.panels.panels[wizard.currentStep].id}`);
  // });
});
