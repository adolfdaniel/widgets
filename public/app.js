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

  if (window.translation) {
    translation.canTranslate({sourceLanguage:'en-us', targetLanguage: 'es-es'});
  } else {
    console.log("translation API is not available");
  }
})


window.addEventListener('beforeinstallprompt', (event) => {
  // Prevent the mini-infobar from appearing on mobile.
  event.preventDefault();
  console.log('👍', 'beforeinstallprompt', event);
  // Stash the event so it can be triggered later.
  window.deferredPrompt = event;
  // Remove the 'hidden' class from the install button container.
  divInstall.classList.toggle('hidden', false);
});

// listen to enter keydown event and prompt for install.
document.addEventListener('keydown', async (event) => {
  if (event.keyCode === 13) {
    // Enter key pressed
    if (window.deferredPrompt) {
      // Show the install prompt.
      window.deferredPrompt.prompt();
      // Log the result
      const result = await window.deferredPrompt.userChoice;
      console.log('👍', 'userChoice', result);
      // Reset the deferred prompt variable, since
      // prompt() can only be called once.
      window.deferredPrompt = null;
    }
  }
});

window.addEventListener('appinstalled', (event) => {
  console.log('👍', 'appinstalled', event);
  // Clear the deferredPrompt so it can be garbage collected
  window.deferredPrompt = null;
});
