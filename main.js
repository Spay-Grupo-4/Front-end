let currentStep = 1;
let selectedFile = null;

const API_BASE_URL = `http://${window.location.hostname}:5000`;

function showManualForm() {
  document.getElementById('initialScreen').classList.add('hidden');
  document.getElementById('manualForm').classList.remove('hidden');
  currentStep = 1;
  updateStepper();
  updateFormStep();
}

function showCsvUpload() {
  document.getElementById('initialScreen').classList.add('hidden');
  document.getElementById('csvUpload').classList.remove('hidden');
}

function backToInitial() {
  document.getElementById('manualForm').classList.add('hidden');
  document.getElementById('csvUpload').classList.add('hidden');
  document.getElementById('initialScreen').classList.remove('hidden');
  document.getElementById('leadForm').reset();
  currentStep = 1;
  updateStepper();
  updateFormStep();
  selectedFile = null;
  document.getElementById('fileInfo').classList.add('hidden');
  document.getElementById('uploadBtn').disabled = true;
}

function nextStep() {
  if (validateStep(currentStep)) {
    currentStep++;
    updateStepper();
    updateFormStep();
  }
}

function prevStep() {
  currentStep--;
  updateStepper();
  updateFormStep();
}

function updateStepper() {
  document.querySelectorAll('.step').forEach((step) => {
    const stepNum = parseInt(step.dataset.step, 10);
    if (stepNum < currentStep) {
      step.classList.add('completed');
      step.classList.remove('active');
    } else if (stepNum === currentStep) {
      step.classList.add('active');
      step.classList.remove('completed');
    } else {
      step.classList.remove('active', 'completed');
    }
  });
}

function updateFormStep() {
  document.querySelectorAll('.form-step').forEach((step) => {
    step.classList.remove('active');
  });
  document
    .querySelector(`.form-step[data-step="${currentStep}"]`)
    .classList.add('active');
}

function validateStep(step) {
  const currentFormStep = document.querySelector(
    `.form-step[data-step="${step}"]`,
  );
  const inputs = currentFormStep.querySelectorAll(
    'input[required], select[required]',
  );
  let valid = true;

  inputs.forEach((input) => {
    if (!input.value.trim()) {
      input.classList.add('error');
      valid = false;
    } else {
      input.classList.remove('error');
    }
  });

  if (!valid) {
    showModal(
      'Atenção',
      'Por favor, preencha todos os campos obrigatórios.',
      'warning',
    );
  }

  return valid;
}

async function submitForm() {
  if (!validateStep(currentStep)) {
    return;
  }

  const payload = {
    cnpj: document.getElementById('cnpj').value,
    type: document.getElementById('type').value,
    nomeSocial: document.getElementById('razaoSocial').value,
    nomeComercial: document.getElementById('nomeComercial').value,
    telefone: document.getElementById('telefone').value,
    cep: document.getElementById('cep').value,
    uf: document.getElementById('uf').value,
    municipio: document.getElementById('municipio').value,
    bairro: document.getElementById('bairro').value,
    complemento: document.getElementById('complemento').value,
    logradouro: document.getElementById('logradouro').value,
    patrimonioLiquido: document.getElementById('patrimonioLiquido').value,
    dataInicioSituacao: document.getElementById('dataInicioSituacao').value,
    dataRegistro: document.getElementById('dataRegistro').value,
    segmentoComercial: document.getElementById('segmentoComercial').value,
  };

  try {
    const response = await fetch(`${API_BASE_URL}/leads`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    let result = null;
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      result = await response.json();
    } else {
      const text = await response.text();
      result = { message: text };
    }

    if (!response.ok) {
      const errorMsg = result && result.message
        ? result.message
        : 'Falha ao salvar lead no servidor.';
      showModal('Erro', errorMsg, 'error');
      return;
    }

    const message = (result && result.message)
      ? result.message
      : 'Lead cadastrado e salvo com sucesso!';

    showModal('Sucesso!', message, 'success');
    setTimeout(() => {
      backToInitial();
    }, 2000);
  } catch (error) {
    console.error('Erro ao enviar lead para a API:', error);
    showModal(
      'Erro',
      'Não foi possível conectar ao servidor. Verifique se a API está rodando.',
      'error',
    );
  }
}

const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');

if (dropZone && fileInput) {
  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('drag-over');
  });

  dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('drag-over');
  });

  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    const { files } = e.dataTransfer;
    handleFileSelect(files[0]);
  });

  fileInput.addEventListener('change', (e) => {
    handleFileSelect(e.target.files[0]);
  });
}

function handleFileSelect(file) {
  if (file && file.name.toLowerCase().endsWith('.pdf')) {
    selectedFile = file;
    document.getElementById('fileName').textContent = file.name;
    document.getElementById('fileSize').textContent = formatFileSize(file.size);
    document.getElementById('fileInfo').classList.remove('hidden');
    document.getElementById('uploadBtn').disabled = false;
  } else {
    showModal('Erro', 'Por favor, selecione um arquivo PDF válido.', 'error');
  }
}

function removeFile() {
  selectedFile = null;
  fileInput.value = '';
  document.getElementById('fileInfo').classList.add('hidden');
  document.getElementById('uploadBtn').disabled = true;
}

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / 1048576).toFixed(2)} MB`;
}

async function uploadFile() {
  if (!selectedFile) {
    showModal('Erro', 'Nenhum arquivo selecionado.', 'error');
    return;
  }

  const uploadBtn = document.getElementById('uploadBtn');
  if (uploadBtn) uploadBtn.disabled = true;

  const formData = new FormData();
  formData.append('file', selectedFile);

  try {
    const response = await fetch(`${API_BASE_URL}/upload_pdf`, {
      method: 'POST',
      body: formData,
    });

    let result = null;
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      result = await response.json();
    } else {
      const text = await response.text();
      result = { message: text };
    }

    if (!response.ok || !result.success) {
      const errorMsg = (result && result.message)
        ? result.message
        : 'Falha ao enviar PDF para o servidor.';
      showModal('Erro', errorMsg, 'error');
      if (uploadBtn) uploadBtn.disabled = false;
      return;
    }

    const message = (result && result.message)
      ? result.message
      : `Arquivo "${selectedFile.name}" enviado com sucesso para a bronze!`;

    showModal('Sucesso!', message, 'success');
    setTimeout(() => {
      backToInitial();
    }, 2000);
  } catch (error) {
    console.error('Erro ao enviar PDF para a API:', error);
    showModal(
      'Erro',
      'Não foi possível conectar ao servidor. Verifique se a API está rodando.',
      'error',
    );
    if (uploadBtn) uploadBtn.disabled = false;
  }
}

function showModal(title, message, type = 'success') {
  const modal = document.getElementById('modal');
  const modalIcon = modal.querySelector('.modal-icon');

  document.getElementById('modalTitle').textContent = title;
  document.getElementById('modalMessage').textContent = message;

  modalIcon.classList.remove('success', 'warning', 'error');
  modalIcon.classList.add(type);

  if (type === 'success') {
    modalIcon.textContent = '✓';
  } else if (type === 'warning') {
    modalIcon.textContent = '⚠';
  } else if (type === 'error') {
    modalIcon.textContent = '✕';
  }

  modal.classList.remove('hidden');
}

function closeModal() {
  document.getElementById('modal').classList.add('hidden');
}

// ===== Máscaras de formatação de campos =====

function formatCNPJ(value) {
  const digits = value.replace(/\D/g, '').slice(0, 14);

  let formatted = '';
  if (digits.length > 0) {
    formatted = digits.slice(0, 2);
  }
  if (digits.length >= 3) {
    formatted += `.${digits.slice(2, 5)}`;
  }
  if (digits.length >= 6) {
    formatted += `.${digits.slice(5, 8)}`;
  }
  if (digits.length >= 9) {
    formatted += `/${digits.slice(8, 12)}`;
  }
  if (digits.length >= 13) {
    formatted += `-${digits.slice(12, 14)}`;
  }

  return formatted;
}

function formatPhone(value) {
  const digits = value.replace(/\D/g, '').slice(0, 11);

  if (!digits) return '';

  const ddd = digits.slice(0, 2);
  let rest = digits.slice(2);

  if (rest.length <= 4) {
    return `(${ddd}) ${rest}`;
  }

  if (rest.length <= 9) {
    return `(${ddd}) ${rest.slice(0, rest.length - 4)}-${rest.slice(-4)}`;
  }

  // 11 dígitos: celular (XX) XXXXX-XXXX
  return `(${ddd}) ${rest.slice(0, 5)}-${rest.slice(5, 9)}`;
}

function formatCEP(value) {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

function fetchAddressByCEP(cepValue) {
  const cep = cepValue.replace(/\D/g, '');
  if (cep.length !== 8) {
    return;
  }

  fetch(`https://viacep.com.br/ws/${cep}/json/`)
    .then((response) => response.json())
    .then((data) => {
      if (data.erro) {
        showModal('Atenção', 'CEP não encontrado. Verifique o número informado.', 'warning');
        return;
      }

      const logradouroInput = document.getElementById('logradouro');
      const bairroInput = document.getElementById('bairro');
      const municipioInput = document.getElementById('municipio');
      const ufInput = document.getElementById('uf');
      const complementoInput = document.getElementById('complemento');

      if (logradouroInput) logradouroInput.value = data.logradouro || '';
      if (bairroInput) bairroInput.value = data.bairro || '';
      if (municipioInput) municipioInput.value = data.localidade || '';
      if (ufInput) ufInput.value = (data.uf || '').toUpperCase().slice(0, 2);
      if (complementoInput) complementoInput.value = data.complemento || '';
    })
    .catch(() => {
      showModal('Erro', 'Não foi possível consultar o CEP no momento.', 'error');
    });
}

function formatCurrencyBRL(value) {
  const digits = value.replace(/\D/g, '').slice(0, 15);
  if (!digits) return '';

  const number = Number(digits) / 100;
  if (Number.isNaN(number)) return '';

  return number.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function setupInputMasks() {
  const cnpjInput = document.getElementById('cnpj');
  const telefoneInput = document.getElementById('telefone');
  const cepInput = document.getElementById('cep');
  const ufInput = document.getElementById('uf');
  const patrimonioInput = document.getElementById('patrimonioLiquido');

  if (cnpjInput) {
    cnpjInput.addEventListener('input', () => {
      cnpjInput.value = formatCNPJ(cnpjInput.value);
    });
  }

  if (telefoneInput) {
    telefoneInput.addEventListener('input', () => {
      telefoneInput.value = formatPhone(telefoneInput.value);
    });
  }

  if (cepInput) {
    cepInput.addEventListener('input', () => {
      cepInput.value = formatCEP(cepInput.value);
    });

    cepInput.addEventListener('blur', () => {
      const digits = cepInput.value.replace(/\D/g, '');
      if (digits.length === 8) {
        fetchAddressByCEP(cepInput.value);
      }
    });
  }

  if (ufInput) {
    ufInput.addEventListener('input', () => {
      ufInput.value = ufInput.value.replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 2);
    });
  }

  if (patrimonioInput) {
    patrimonioInput.addEventListener('input', () => {
      patrimonioInput.value = formatCurrencyBRL(patrimonioInput.value);
    });
  }
}

// Inicializa máscaras após carregar o script
setupInputMasks();
