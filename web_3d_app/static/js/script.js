// Wait for the DOM to fully load
document.addEventListener('DOMContentLoaded', () => {
  // DOM references
  const fileInput = document.getElementById('imageInput');
  const uploadButton = document.getElementById('uploadButton');
  const downloadButton = document.getElementById('downloadButton');
  const responseMessage = document.getElementById('responseMessage');
  const viewerContainer = document.getElementById('viewerContainer');
  const dropZone = document.getElementById('dropZone');

  // Initial UI setup
  downloadButton.style.display = 'none';
  let previewImage = null;
  let currentModelDataUrl = null;

  // Triggered when a file is selected through input
  fileInput.addEventListener('change', () => {
    if (fileInput.files.length > 0) {
      uploadButton.disabled = false;
      showPreview(fileInput.files[0]);
    } else {
      clearPreview();
    }
  });

  // Handles image upload and model rendering
  uploadButton.addEventListener('click', async () => {
    const file = fileInput.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    uploadButton.disabled = true;
    responseMessage.innerText = '⏳ Processing...';

    try {
      // Upload image and wait for server response
      const response = await fetch('/upload', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();
      responseMessage.innerText = result.message;

      // If model data is received, display it using model-viewer
      if (result.model_data_url) {
        currentModelDataUrl = result.model_ply_url;
        viewerContainer.innerHTML = `
          <model-viewer
            src="${result.model_data_url}"
            auto-rotate
            camera-controls
            style="width: 100%; height: 500px;">
          </model-viewer>
        `;
        downloadButton.disabled = false;
        downloadButton.style.display = 'inline-block';
      }
    } catch (err) {
      responseMessage.innerText = '❌ Error uploading image. Try again.';
      console.error(err);
    } finally {
      uploadButton.disabled = false;
    }
  });

  // Handles model download in PLY format
  downloadButton.addEventListener('click', () => {
    if (!currentModelDataUrl) return;

    const base64Data = currentModelDataUrl.split(',')[1];
    const blob = base64ToBlob(base64Data, 'model/gltf-binary');

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'model.ply';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  });

  // Drag and drop handlers for file input
  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
  });

  dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('dragover');
  });

  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');

    const files = e.dataTransfer.files;
    if (files.length) {
      fileInput.files = files;
      uploadButton.disabled = false;
      showPreview(files[0]);
    }
  });

  // Displays image preview in drop zone
  function showPreview(file) {
    clearPreview();

    const defaultImage = document.getElementById('defaultImage');
    const instructions = dropZone.querySelectorAll('p, small');

    if (defaultImage) {
      defaultImage.style.display = 'none';
      instructions.forEach(el => el.style.display = 'none');
    }

    previewImage = document.createElement('img');
    previewImage.className = 'preview-image';
    previewImage.alt = 'Selected Image Preview';
    previewImage.style.maxWidth = '100%';
    previewImage.style.marginTop = '1rem';
    previewImage.style.borderRadius = '6px';
    previewImage.style.objectFit = 'contain';
    previewImage.style.maxHeight = '220px';

    const reader = new FileReader();
    reader.onload = function(e) {
      previewImage.src = e.target.result;
    };
    reader.readAsDataURL(file);

    dropZone.classList.add('has-preview');
    dropZone.appendChild(previewImage);
  }

  // Resets the preview UI and disables download
  function clearPreview() {
    if (previewImage) {
      previewImage.remove();
      previewImage = null;
    }

    const defaultImage = document.getElementById('defaultImage');
    if (defaultImage) {
      defaultImage.style.display = 'block';
      dropZone.classList.remove('has-preview');
    }

    downloadButton.style.display = 'none';
  }

  // Converts base64 string to a Blob object
  function base64ToBlob(base64, mime) {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mime });
  }
});
