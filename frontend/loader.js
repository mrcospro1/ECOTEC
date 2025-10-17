document.addEventListener("DOMContentLoaded", () => {
  const loader = document.getElementById("loader");
  if (!loader) return;

  loader.classList.add("fade-out");

  setTimeout(() => {
    loader.style.display = "none";
    document.body.style.overflow = "auto";
  }, 800); 
});

