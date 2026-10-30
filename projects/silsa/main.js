(() => {
  const examples = {
    tower: ['Tower', 'Open arches, repeating windows, and connected architectural detail.'],
    rover: ['Rover', 'Thin wheel structures and a coherent chassis across rendered views.'],
    wagon: ['Wagon', 'Open wheels, curved supports, and repeated structural elements.'],
    chair: ['Chair', 'Slender supports, armrests, and separated chair legs.'],
    drone: ['Drone', 'Thin propellers and a connected frame extending across the object.'],
    robot: ['Robot', 'Articulated limbs and fine details in a complex silhouette.'],
    flower: ['Flower', 'Layered petals and fine, closely spaced surface geometry.'],
    motorcycle: ['Motorcycle', 'Connected wheels, a thin frame, and detailed mechanical geometry.']
  };
  let currentObject = 'tower';
  let currentView = 1;
  const input = document.querySelector('#input-image');
  const output = document.querySelector('#output-image');
  const outputFrame = document.querySelector('#output-frame');
  function updateGallery() {
    const [name, description] = examples[currentObject];
    input.src = output.src = `static/images/${currentObject}.webp`;
    input.alt = `Input image of the ${name.toLowerCase()}`;
    output.alt = `SILSA-generated ${name.toLowerCase()}, rendered view ${currentView}`;
    outputFrame.style.setProperty('--view', currentView);
    document.querySelector('#example-name').textContent = name;
    document.querySelector('#example-description').textContent = description;
    document.querySelector('#view-label').textContent = `View ${currentView} / 4`;
    document.querySelectorAll('[data-object]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.object === currentObject)));
    document.querySelectorAll('[data-view]').forEach(button => button.setAttribute('aria-pressed', String(Number(button.dataset.view) === currentView)));
  }
  document.querySelectorAll('[data-object]').forEach(button => button.addEventListener('click', () => {currentObject = button.dataset.object; updateGallery();}));
  document.querySelectorAll('[data-view]').forEach(button => button.addEventListener('click', () => {currentView = Number(button.dataset.view); updateGallery();}));

  const benchmarkTabs = [...document.querySelectorAll('[role=tab]')];
  function selectTab(tab) {
    benchmarkTabs.forEach(button => {
      const active = button === tab;
      button.setAttribute('aria-selected', String(active));
      button.tabIndex = active ? 0 : -1;
      document.getElementById(button.getAttribute('aria-controls')).hidden = !active;
    });
  }
  benchmarkTabs.forEach((tab, index) => {
    tab.addEventListener('click', () => selectTab(tab));
    tab.addEventListener('keydown', event => {
      let next;
      if (event.key === 'ArrowRight') next = (index + 1) % benchmarkTabs.length;
      if (event.key === 'ArrowLeft') next = (index + benchmarkTabs.length - 1) % benchmarkTabs.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = benchmarkTabs.length - 1;
      if (next === undefined) return;
      event.preventDefault(); selectTab(benchmarkTabs[next]); benchmarkTabs[next].focus();
    });
  });

})();
