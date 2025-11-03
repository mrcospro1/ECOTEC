// ===============================
// SISTEMA DE WIZARD MULTIPASOS
// ===============================

class Steps {
  constructor(wizard) {
    this.wizard = wizard;
    this.steps = this.getSteps();
    this.stepsQuantity = this.getStepsQuantity();
    this.currentStep = 0;
  }

  setCurrentStep(currentStep) {
    this.currentStep = currentStep;
  }

  getSteps() {
    return this.wizard.getElementsByClassName('step');
  }

  getStepsQuantity() {
    return this.getSteps().length;
  }

  handleConcludeStep() {
    this.steps[this.currentStep].classList.add('-completed');
  }

  handleStepsClasses(movement) {
    // Actualiza las clases visuales del stepper según avance o retroceso
    if (movement > 0) {
      this.steps[this.currentStep].classList.add('-completed');
    } else if (movement < 0) {
      if (this.steps[this.currentStep + 1])
        this.steps[this.currentStep + 1].classList.remove('-completed');
    }
  }
}

// ===============================
// PANEL CONTROLLER
// ===============================

class Panels {
  constructor(wizard) {
    this.wizard = wizard;
    this.panelsContainer = this.getPanelsContainer();
    this.panels = this.getPanels();
    this.currentStep = 0;

    // Inicializa el primer panel visible
    this.updatePanelsPosition(this.currentStep);
    this.updatePanelsContainerHeight();
  }

  getCurrentPanelHeight() {
    return `${this.getPanels()[this.currentStep].offsetHeight}px`;
  }

  getPanelsContainer() {
    return this.wizard.querySelector('.panels');
  }

  getPanels() {
    return this.wizard.getElementsByClassName('panel');
  }

  updatePanelsContainerHeight() {
    this.panelsContainer.style.height = this.getCurrentPanelHeight();
  }

  updatePanelsPosition(currentStep) {
    const panels = this.panels;

    for (let i = 0; i < panels.length; i++) {
      panels[i].classList.remove(
        'movingIn',
        'movingOutBackward',
        'movingOutFoward'
      );

      if (i !== currentStep) {
        if (i < currentStep) panels[i].classList.add('movingOutBackward');
        else if (i > currentStep) panels[i].classList.add('movingOutFoward');
      } else {
        panels[i].classList.add('movingIn');
      }
    }

    this.updatePanelsContainerHeight();
  }

  setCurrentStep(currentStep) {
    this.currentStep = currentStep;
    this.updatePanelsPosition(currentStep);
  }
}

// ===============================
// WIZARD PRINCIPAL
// ===============================

class Wizard {
  constructor(obj) {
    this.wizard = obj;
    this.panels = new Panels(this.wizard);
    this.steps = new Steps(this.wizard);
    this.stepsQuantity = this.panels.getPanels().length;
    this.currentStep = this.steps.currentStep;

    this.concludeControlMoveStepMethod = this.steps.handleConcludeStep.bind(this.steps);
    this.wizardConclusionMethod = this.handleWizardConclusion.bind(this);
  }

  updateButtonsStatus() {
    if (this.currentStep === 0)
      this.previousControl.classList.add('disabled');
    else
      this.previousControl.classList.remove('disabled');
  }

  updtadeCurrentStep(movement) {
    this.currentStep += movement;
    this.steps.setCurrentStep(this.currentStep);
    this.panels.setCurrentStep(this.currentStep);

    this.handleNextStepButton();
    this.updateButtonsStatus();
  }

  handleNextStepButton() {
    if (this.currentStep === this.stepsQuantity - 1) {
      this.nextControl.innerHTML = 'Confirmar!';
      this.nextControl.removeEventListener('click', this.nextControlMoveStepMethod);
      this.nextControl.addEventListener('click', this.concludeControlMoveStepMethod);
      this.nextControl.addEventListener('click', this.wizardConclusionMethod);
    } else {
      this.nextControl.innerHTML = 'Siguiente';
      this.nextControl.addEventListener('click', this.nextControlMoveStepMethod);
      this.nextControl.removeEventListener('click', this.concludeControlMoveStepMethod);
      this.nextControl.removeEventListener('click', this.wizardConclusionMethod);
    }
  }

  handleWizardConclusion() {
    this.wizard.classList.add('completed');
    alert('¡Presupuesto completado! (Aquí se enviaría la información)');
  }

  addControls(previousControl, nextControl) {
    this.previousControl = previousControl;
    this.nextControl = nextControl;
    this.previousControlMoveStepMethod = this.moveStep.bind(this, -1);
    this.nextControlMoveStepMethod = this.moveStep.bind(this, 1);

    previousControl.addEventListener('click', this.previousControlMoveStepMethod);
    nextControl.addEventListener('click', this.nextControlMoveStepMethod);

    this.updateButtonsStatus();
  }

  // ===============================
  // NAVEGACIÓN ENTRE PASOS
  // ===============================

  moveStep(movement) {
    // Retroceder
    if (movement < 0) {
      if (this.currentStep > 0) {
        this.updtadeCurrentStep(movement);
        this.steps.handleStepsClasses(movement);
      }
      return;
    }

    // Avanzar (ramificado)
    const currentPanelElement = this.panels.panels[this.currentStep];
    const currentPanelID = currentPanelElement.id;
    let nextPanelID = null;

    // Validar formulario del panel actual
    const currentForm = currentPanelElement.querySelector('form');
    if (currentForm && !currentForm.checkValidity()) {
      alert('Por favor, completa los campos requeridos.');
      currentForm.reportValidity();
      return;
    }

    // ===============================
    // Lógica de ramificación
    // ===============================

    if (currentPanelID === 'panel-personas') {
      nextPanelID = 'panel-agua';
    }

    else if (currentPanelID === 'panel-agua') {
      const selectedOption = currentPanelElement.querySelector('input[name="agua"]:checked');
      if (!selectedOption) {
        alert('Por favor, selecciona una opción de agua.');
        return;
      }

      // 🧩 Lectura segura del data-target-panel
      nextPanelID =
        selectedOption.dataset.targetPanel ||
        selectedOption.parentElement?.dataset.targetPanel ||
        selectedOption.closest('[data-target-panel]')?.dataset.targetPanel;

      if (!nextPanelID) {
        console.error('⚠️ No se encontró data-target-panel para el radio seleccionado.');
        return;
      }
    }

    else if (currentPanelID === 'panel-tanque-altura') {
      nextPanelID = 'panel-atmosferico-auto';
    }

    else if (currentPanelID === 'panel-presurizado-auto') {
      nextPanelID = 'panel-resumen-presurizado';
    }

    else if (currentPanelID === 'panel-atmosferico-auto') {
      nextPanelID = 'panel-resumen-atmosferico';
    }

    else {
      // Si es un panel final, concluir
      this.handleWizardConclusion();
      return;
    }

    // ===============================
    // Actualización de posición
    // ===============================
    if (nextPanelID) {
      const panelsArray = Array.from(this.panels.panels);
      const newStepIndex = panelsArray.findIndex(panel => panel.id === nextPanelID);

      if (newStepIndex !== -1) {
        const realMovement = newStepIndex - this.currentStep;
        this.updtadeCurrentStep(realMovement);
        this.steps.handleStepsClasses(realMovement);
      }
    }
  }

  validateMovement(movement) {
    const fowardMov = movement > 0 && this.currentStep < this.stepsQuantity - 1;
    const backMov = movement < 0 && this.currentStep > 0;
    return fowardMov || backMov;
  }
}

// ===============================
// INICIALIZACIÓN
// ===============================

document.addEventListener('DOMContentLoaded', () => {
  const wizardElement = document.getElementById('wizard');
  const wizard = new Wizard(wizardElement);
  const buttonNext = document.querySelector('.next');
  const buttonPrevious = document.querySelector('.previous');

  wizard.addControls(buttonPrevious, buttonNext);

  // 🔍 Log visual opcional
  wizardElement.addEventListener('transitionend', () => {
    console.log(`🔹 Panel activo: ${wizard.panels.panels[wizard.currentStep].id}`);
  });
});
