const registerServiceWorker = async () => {
  try {
    await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    console.log('Service worker registered');
    postToSW('isWidgetsSupported');
  } catch (e) {
    console.log(`Registration failed: ${e}`);
  }
}

async function getDefaultManifestText() {
  const response = await fetch('manifest.webmanifest');
  const defaultManifest = await response.json();
  return JSON.stringify(defaultManifest, null, " ").replaceAll('{0}', document.location.origin);
}

async function setDefaultManifest() {
  localStorage.setItem('manifestText', await getDefaultManifestText());
  location.reload();
}

document.addEventListener('DOMContentLoaded', () => {
  // Hook up the buttons
  document.getElementById("update").addEventListener("click", () => {
    localStorage.setItem('manifestText', document.getElementById("manifestText").value);
    location.reload();
  });
  document.getElementById("reset").addEventListener("click", () => {
    setDefaultManifest();
  });

  // Add the manifest early so it is noticed automatically
  document.head.innerHTML += "<link rel='manifest' href='data:application/manifest+json," + localStorage.getItem('manifestText').replaceAll("'", "&apos;") + "'>";
  document.getElementById("manifestText").value = localStorage.getItem('manifestText');

  // Register the service worker
  if (navigator.serviceWorker) {
    registerServiceWorker();
  }
})

// Establish the default manifest value to use, if not already defined
if (!localStorage.getItem('manifestText')) {
  setDefaultManifest();
}
