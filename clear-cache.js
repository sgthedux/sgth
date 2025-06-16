// Script para limpiar el localStorage corrupto y evitar bucles infinitos
console.log("🧹 Limpiando localStorage corrupto...");

if (typeof window !== 'undefined') {
  // Limpiar todas las claves de formulario
  const keys = Object.keys(localStorage);
  const formKeys = keys.filter(key => key.startsWith('form_'));
  
  console.log("📋 Claves de formulario encontradas:", formKeys);
  
  formKeys.forEach(key => {
    localStorage.removeItem(key);
    console.log("🗑️ Removido:", key);
  });
  
  console.log("✅ Limpieza completada. Por favor recarga la página.");
  
  // También limpiar sessionStorage por si acaso
  const sessionKeys = Object.keys(sessionStorage);
  const sessionFormKeys = sessionKeys.filter(key => key.startsWith('form_'));
  
  if (sessionFormKeys.length > 0) {
    console.log("📋 Claves de formulario en sessionStorage:", sessionFormKeys);
    sessionFormKeys.forEach(key => {
      sessionStorage.removeItem(key);
      console.log("🗑️ Removido de sessionStorage:", key);
    });
  }
} else {
  console.log("⚠️ Este script debe ejecutarse en el navegador");
}
