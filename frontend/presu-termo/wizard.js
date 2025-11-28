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
function mostrarResumen(datos) {
    const cont = document.getElementById("resultado-resumen");
    
    // Traducir el booleano guardado a texto para mostrar
    const automatizadoTexto = datos.datosGuardados.automatizado ? "Sí" : "No";

    cont.innerHTML = `
        <h5 class="mb-3 fw-bold">${datos.modelo}</h5>

        <p><strong>Precio base:</strong> $${datos.precioBase}</p>

        <p><strong>Accesorios:</strong></p>
        <ul>
            ${datos.accesorios.map(a => `
                <li>${a.nombre}: $${a.precio}</li>
            `).join("")}
        </ul>

        <p><strong>Precio accesorios:</strong> $${datos.precioAccesorios}</p>
        <p><strong>Total final:</strong> <span class="fw-bold">$${datos.precioFinal}</span></p>

        <hr>

        <p><strong>Personas:</strong> ${datos.datosGuardados.personas}</p>
        <p><strong>Tipo de agua:</strong> ${datos.datosGuardados.agua}</p>
        <p><strong>Automatizado:</strong> ${automatizadoTexto}</p>
        <p><strong>Altura:</strong> ${datos.datosGuardados.altura} m</p>
    `;
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
  getCurrentPanelHeight() {
    const p = this.panels[this.currentStep];
    // Asegúrate de que el panel es visible (o moviéndose) antes de obtener la altura
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
    this.updatePanelsPosition(this.currentStep);
    this.updatePanelsContainerHeight();
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

    const calculoRuta = "/presupuesto-termotanques/calculo"
    // Enviar al servidor Node
    fetch(`http://localhost:3000${calculoRuta}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
      .then(res => res.json())
      .then(data => {
        mostrarResumen(data);
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
        // Obtener el data-target-panel
        nextPanelID = selectedOption.closest('[data-target-panel]')?.dataset.targetPanel;
        if (!nextPanelID) {
            console.error('No se encontró data-target-panel para la opción seleccionada.');
            return;
        }
    } else if (currentPanelID === 'panel-tanque-altura') {
        nextPanelID = 'panel-atmosferico-auto';
    } else if (currentPanelID === 'panel-presurizado-auto') {
        // *** CAMBIO CLAVE 1: Usar un solo panel de resultados si es posible ***
        // Apuntamos al panel de resumen único (ver corrección HTML abajo)
        nextPanelID = 'panel-resultado-final'; 
    } else if (currentPanelID === 'panel-atmosferico-auto') {
        // *** CAMBIO CLAVE 2: Usar un solo panel de resultados si es posible ***
        nextPanelID = 'panel-resultado-final';
    } 
    
    // El panel de resultado final DEBE llamar a la conclusión
    if (currentPanelID === 'panel-resultado-final') {
        // Si estamos en el resumen final y presionamos siguiente (Confirmar)
        this.handleConcludeStep(); // Marca todos los steps como completados
        this.handleWizardConclusion(); // Llama a la API y muestra el resultado
        return;
    }
    
    // Si el siguiente panel es el resumen final, primero actualizamos el contenido visual
    if (nextPanelID === 'panel-resultado-final') {
        this.updateResumen(); // Lógica para previsualizar los datos recogidos
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
    // 1. Personas: Siempre en el mismo campo
    const personas = document.querySelector('#form-personas input[name="personas"]')?.value || '';
    
    // 2. Agua: Siempre en el mismo campo
    const agua = document.querySelector('#form-agua input[name="agua"]:checked')?.value || '';
    
    // 3. Automatizado: Buscar en AMBOS formularios de automatización. 
    // Solo uno debería tener un valor 'checked' según la navegación.
    let automatizado = document.querySelector('#form-presurizado-auto input[name="automatizado"]:checked')?.value;
    if (!automatizado) {
        automatizado = document.querySelector('#form-atmosferico-auto input[name="automatizado"]:checked')?.value;
    }
    // Convertir 'si'/'no' a booleano o cadena vacía si no se encontró
    automatizado = automatizado === 'si' ? true : (automatizado === 'no' ? false : '');

    // 4. Altura: Buscar en el formulario de altura (solo se usa en flujo atmosférico/red)
    const altura = document.querySelector('#form-altura input[name="altura"]')?.value || '0';
    
    return { 
        personas: personas, 
        agua: agua, 
        automatizado: automatizado, // Enviamos el booleano al backend
        altura: altura 
    };
}

 // Actualiza los datos que se ven ANTES de enviar (solo para el usuario)
updateResumen() {
    const data = this.collectFormData(); 

    // Traducir 'agua' a un texto legible para el usuario
    let tipoAguaTexto = data.agua;
    if (data.agua === 'tanque') tipoAguaTexto = 'Tanque (Atmosférico)';
    else if (data.agua === 'red') tipoAguaTexto = 'Red (Atmosférico)';
    else if (data.agua === 'bomba') tipoAguaTexto = 'Bomba (Presurizado)';

    // Traducir 'automatizado' a un texto legible
    const automatizadoTexto = data.automatizado === true ? 'Sí' : (data.automatizado === false ? 'No' : '-');
    
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
                <li><strong>Altura tanque:</strong> ${data.altura || '-'} m</li>
                <li><strong>Automatizado:</strong> ${automatizadoTexto}</li>
            </ul>
        `;
    }
    
    // Limpiar el contenido de resultado-resumen y mostrar el resumen preliminar
    document.getElementById('resultado-resumen').innerHTML = `<p class="text-muted">Presiona **Confirmar** para calcular el presupuesto.</p>`;
    resumenPanel.querySelector('.resumen-preliminar-container').innerHTML = contenidoHTML;
}
}

// ===============================
// INICIALIZACIÓN al DOM cargado
// ===============================
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
  new Wizard(wizardElement);

  // OPTIONAL: debugging rápido (descomentar para ver el panel actual en la consola)
  // wizardElement.addEventListener('transitionend', () => {
  //   console.log(`Panel activo: ${wizard.panels.panels[wizard.currentStep].id}`);
  // });
});



