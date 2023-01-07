const registerServiceWorker = async () => {
  try {
    await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    console.log('Service worker registered');
    postToSW('isWidgetsSupported');
  } catch (e) {
    console.log(`Registration failed: ${e}`);
  }
}

// Replace all the spaces in the values of JSON with non-breaking spaces.
// This is to prevent the browser from collapsing the spaces when the manifest
// is displayed in the textarea.
function escapeManifestSpaces(manifest) {
  for (const key in manifest) {
    if (typeof manifest[key] === 'string') {
      manifest[key] = manifest[key].replaceAll(' ', "&nbsp;");
    } else if (typeof manifest[key] === 'object') {
      manifest[key] = escapeManifestSpaces(manifest[key]);
    } else if (typeof manifest[key] === 'array') {
      manifest[key] = manifest[key].map(item => escapeManifestSpaces(item));
    }
  }
  return manifest;
}

async function getDefaultManifestText() {
  const response = await fetch('manifest.webmanifest');
  const defaultManifest = await response.json();
  return JSON.stringify(defaultManifest, null, " ").replaceAll('"/', `"${document.location.origin}/`);
}

async function setDefaultManifest() {
  localStorage.setItem('manifestText', '');
  location.reload();
}

document.addEventListener('DOMContentLoaded', async () => {
  // Hook up the buttons
  document.getElementById("update").addEventListener("click", () => {
    localStorage.setItem('manifestText', document.getElementById("manifestText").value);
    location.reload();
  });
  document.getElementById("reset").addEventListener("click", () => {
    setDefaultManifest();
  });

  const manifestText = localStorage.getItem('manifestText');
  if (!manifestText) {
    document.head.innerHTML += "<link rel='manifest' href='manifest.webmanifest'>";
  } else {
    // Escape the quotes and spaces from the manifest text so it can be used in an HTML attribute.
    const escapedManifestText = JSON.stringify(escapeManifestSpaces(JSON.parse(manifestText))).replaceAll("'", "&apos;");
    // Add the manifest early so it is noticed automatically
    document.head.innerHTML += "<link rel='manifest' href='data:application/manifest+json," + escapedManifestText + "'>";
  }

  const manifestTextElement = document.getElementById("manifestText");
  manifestTextElement.value = manifestText || await getDefaultManifestText();

  // Register the service worker
  if (navigator.serviceWorker) {
    registerServiceWorker();
  }
})
