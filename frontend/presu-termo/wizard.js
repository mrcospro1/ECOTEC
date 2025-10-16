class Steps{
  constructor(wizard){
    this.wizard = wizard;
    this.steps = this.getSteps();
    this.stepsQuantity = this.getStepsQuantity();
    this.currentStep = 0;
  }
  
  setCurrentStep(currentStep){
    this.currentStep = currentStep;
  }
  
  getSteps(){
    return this.wizard.getElementsByClassName('step');
  }
  
  getStepsQuantity(){
    return this.getSteps().length;
  }
  
  handleConcludeStep(){
    this.steps[this.currentStep].classList.add('-completed');
  }
  
  handleStepsClasses(movement){
    // Ajusta la clase -completed basado en el movimiento y el paso actual
    if(movement > 0) {
      // Si avanza, marca el paso anterior como completado
      // Nota: El cálculo del paso anterior es más complejo con ramificación, 
      // pero para el Stepper simple, solo marcamos los que visitamos.
      this.steps[this.currentStep].classList.add('-completed');
    } else if(movement < 0) {
      // Si retrocede, remueve la clase -completed del paso actual
      this.steps[this.currentStep + 1].classList.remove('-completed'); 
    }
  }
}

class Panels{
  constructor(wizard){
    this.wizard = wizard;
    this.panelWidth = this.wizard.offsetWidth;
    this.panelsContainer = this.getPanelsContainer();
    this.panels = this.getPanels();
    this.currentStep = 0;
    
    // Inicializa el primer panel como visible
    this.updatePanelsPosition(this.currentStep);
    this.updatePanelsContainerHeight();
  }
  
  getCurrentPanelHeight(){
    return `${this.getPanels()[this.currentStep].offsetHeight}px`;
  }
  
  getPanelsContainer(){
    return this.wizard.querySelector('.panels');
  }
  
  getPanels(){
    // Es mejor trabajar con un Array para usar findIndex
    return this.wizard.getElementsByClassName('panel'); 
  }
  
  updatePanelsContainerHeight(){
    this.panelsContainer.style.height = this.getCurrentPanelHeight();
  }
  
  updatePanelsPosition(currentStep){
    const panels = this.panels;
    
    for (let i = 0; i < panels.length; i++) {
        // Limpiamos las clases de movimiento
        panels[i].classList.remove(
            'movingIn',
            'movingOutBackward',
            'movingOutFoward'
        );
        
        if(i !== currentStep){
            // Aplicamos clase de movimiento saliente
            if(i < currentStep) panels[i].classList.add('movingOutBackward');
            else if( i > currentStep ) panels[i].classList.add('movingOutFoward');
        }else{
            // Aplicamos clase de panel entrante
            panels[i].classList.add('movingIn');
        }
    }
    
    this.updatePanelsContainerHeight();
  }
  
  setCurrentStep(currentStep){
    this.currentStep = currentStep;
    this.updatePanelsPosition(currentStep);
  }
}

class Wizard{
  constructor(obj){
    this.wizard = obj;
    this.panels = new Panels(this.wizard);
    this.steps = new Steps(this.wizard);
    this.stepsQuantity = this.panels.getPanels().length; // Cantidad de paneles, no de steps
    this.currentStep = this.steps.currentStep;
    
    this.concludeControlMoveStepMethod = this.steps.handleConcludeStep.bind(this.steps);
    this.wizardConclusionMethod = this.handleWizardConclusion.bind(this);
  }
  
  updateButtonsStatus(){
    if(this.currentStep === 0)
      this.previousControl.classList.add('disabled');
    else
      this.previousControl.classList.remove('disabled');
  }
  
  updtadeCurrentStep(movement){    
    this.currentStep += movement;
    this.steps.setCurrentStep(this.currentStep);
    this.panels.setCurrentStep(this.currentStep);
    
    this.handleNextStepButton();
    this.updateButtonsStatus();
  }
  
  handleNextStepButton(){    
    if(this.currentStep === this.stepsQuantity - 1){      
      this.nextControl.innerHTML = 'Confirmar!';
      
      this.nextControl.removeEventListener('click', this.nextControlMoveStepMethod);
      this.nextControl.addEventListener('click', this.concludeControlMoveStepMethod);
      this.nextControl.addEventListener('click', this.wizardConclusionMethod);
    }else{
      this.nextControl.innerHTML = 'Siguiente';
      
      this.nextControl.addEventListener('click', this.nextControlMoveStepMethod);
      this.nextControl.removeEventListener('click', this.concludeControlMoveStepMethod);
      this.nextControl.removeEventListener('click', this.wizardConclusionMethod);
    }
  }
  
  handleWizardConclusion(){
    this.wizard.classList.add('completed');
    alert('¡Presupuesto completado! (Aquí se enviaría la información)');
  };
  
  addControls(previousControl, nextControl){
    this.previousControl = previousControl;
    this.nextControl = nextControl;
    this.previousControlMoveStepMethod = this.moveStep.bind(this, -1);
    this.nextControlMoveStepMethod = this.moveStep.bind(this, 1);
    
    previousControl.addEventListener('click', this.previousControlMoveStepMethod);
    nextControl.addEventListener('click', this.nextControlMoveStepMethod);
    
    this.updateButtonsStatus();
  }
  
  moveStep(movement){
    if (movement < 0) {
        // Movimiento ATRÁS: Lógica lineal simple (retorna al paso anterior visitado)
        if (this.currentStep > 0) {
            this.updtadeCurrentStep(movement);
            this.steps.handleStepsClasses(movement);
        }
        return; 
    }

    // --- LÓGICA DE MOVIMIENTO ADELANTE (Ramificación) ---
    
    const currentPanelElement = this.panels.panels[this.currentStep];
    const currentPanelID = currentPanelElement.id;
    let nextPanelID = null;

    // 1. Validar formularios antes de avanzar (simplificado)
    const currentForm = currentPanelElement.querySelector('form');
    if (currentForm && !currentForm.checkValidity()) {
        alert('Por favor, rellena los campos requeridos.');
        currentForm.reportValidity(); // Muestra los mensajes de error de HTML5
        return;
    }


    if (currentPanelID === 'panel-agua') {
        // PUNTO DE RAMIFICACIÓN 1: Alimentación de Agua
        const selectedOption = currentPanelElement.querySelector('input[name="agua"]:checked');
        if (!selectedOption) return; // Ya validamos, pero es una doble verificación

        // Busca el ID del panel destino usando el atributo data-target-panel
        const targetElement = selectedOption.closest('.form-check');
        nextPanelID = targetElement.getAttribute('data-target-panel');

    } else if (currentPanelID === 'panel-personas') {
        // PUNTO DE RAMIFICACIÓN 2: Siempre salta a 'panel-agua' después de 'personas'
        nextPanelID = 'panel-agua'; 

    } else if (currentPanelID === 'panel-tanque-altura') {
        // PUNTO DE RAMIFICACIÓN 3: Altura del Tanque -> siempre va al panel de Automatizado Atmosférico
        nextPanelID = 'panel-atmosferico-auto';

    } else if (currentPanelID === 'panel-presurizado-auto') {
        // PUNTO DE RAMIFICACIÓN 4: Automatizado Presurizado -> siempre va al Resumen Presurizado
        nextPanelID = 'panel-resumen-presurizado';

    } else if (currentPanelID === 'panel-atmosferico-auto') {
        // PUNTO DE RAMIFICACIÓN 5: Automatizado Atmosférico -> siempre va al Resumen Atmosférico
        nextPanelID = 'panel-resumen-atmosferico';
        
    } else {
        // Últimos pasos (Resumen): Finaliza el proceso si es el último panel
        this.handleWizardConclusion();
        return;
    }
    
    // --- CÁLCULO DEL NUEVO ÍNDICE Y AVANCE ---
    if (nextPanelID) {
        const panelsArray = Array.from(this.panels.panels);
        const newStepIndex = panelsArray.findIndex(panel => panel.id === nextPanelID);

        if (newStepIndex !== -1) {
            // Calculamos el movimiento real para actualizar el índice de steps/panels
            const movement = newStepIndex - this.currentStep; 
            
            this.updtadeCurrentStep(movement);
            this.steps.handleStepsClasses(movement); // Actualiza la clase completada
        }
    }
  }
  
  validateMovement(movement){
    const fowardMov = movement > 0 && this.currentStep < this.stepsQuantity - 1;
    const backMov = movement < 0 && this.currentStep > 0;
    
    return fowardMov || backMov;
  }
}

// Inicialización: Debes ejecutar este código al final del body en el HTML.
let wizardElement = document.getElementById('wizard');
let wizard = new Wizard(wizardElement);
let buttonNext = document.querySelector('.next');
let buttonPrevious = document.querySelector('.previous');

wizard.addControls(buttonPrevious, buttonNext);