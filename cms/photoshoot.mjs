import {loadPublicContent} from './content-store.mjs';
import {publicItems,safeURL,escapeHTML} from './model.mjs';
let bundle;
try { bundle = await loadPublicContent(); } catch { document.getElementById('photoCountBadge').textContent='Photos could not load. Please refresh.'; throw new Error('Could not load photos'); }

        // ==============================================================================
        // 📸 PHOTOSHOOT & PHOTO EDITING IMAGES ARRAY
        // ------------------------------------------------------------------------------
        // 👇 Yaha aap aasani se apni photos ke links add ya remove kar sakte hain.
        // ==============================================================================

        const publishedPhotos = publicItems(bundle.items, 'photo').filter(item => safeURL(item.image_url, {image:true}));
        let activePhotos = publishedPhotos;
        let photoshootImages = activePhotos.map(item => safeURL(item.image_url, {image:true}));


        // ------------------------------------------------------------------------------
        // 🌐 3D HOLOGRAPHIC SPHERE MOTION ENGINE (BLACK HERO PART)
        // ------------------------------------------------------------------------------
        const sphereStage = document.getElementById('sphereStage');
        const sphereWorld = document.getElementById('sphereWorld');
        let spherePoints = [];

        let rotX = 15;
        let rotY = 0;
        let velX = 0.05;
        let velY = 0.25;
        let isDragging = false;
        let prevPointerX = 0;
        let prevPointerY = 0;
        let startPointerX = 0;
        let startPointerY = 0;

        function getSphereConfig() {
            const w = window.innerWidth;
            if (w < 640) {
                return { radius: 240, cardW: 130, cardH: 90 };
            } else if (w < 1024) {
                return { radius: 340, cardW: 165, cardH: 115 };
            } else {
                return { radius: 440, cardW: 200, cardH: 140 };
            }
        }

        function create3DSphere() {
            if (!photoshootImages || photoshootImages.length === 0) return;
            sphereWorld.innerHTML = '';
            spherePoints = [];

            const total = Math.min(photoshootImages.length, 14);
            const { radius, cardW, cardH } = getSphereConfig();
            const goldenAngle = Math.PI * (3 - Math.sqrt(5));

            for (let i = 0; i < total; i++) {
                const y = total === 1 ? 0 : 1 - (i / (total - 1)) * 2;
                const radiusAtY = Math.sqrt(1 - y * y);
                const theta = goldenAngle * i;

                const baseNormX = Math.cos(theta) * radiusAtY;
                const baseNormY = y;
                const baseNormZ = Math.sin(theta) * radiusAtY;

                const imgIndex = i % photoshootImages.length;
                const imgSrc = photoshootImages[imgIndex];

                const card = document.createElement('div');
                card.className = 'sphere-card-3d rounded-2xl overflow-hidden border border-white/20 bg-neutral-900 shadow-2xl';
                card.style.width = `${cardW}px`;
                card.style.height = `${cardH}px`;
                card.style.marginLeft = `-${cardW / 2}px`;
                card.style.marginTop = `-${cardH / 2}px`;

                card.innerHTML = `
                    <img src="${escapeHTML(imgSrc)}"
                         alt="Product Shoot"
                         class="w-full h-full object-cover" />
                `;

                card.addEventListener('click', (e) => {
                    const distMoved = Math.hypot(prevPointerX - startPointerX, prevPointerY - startPointerY);
                    if (distMoved < 6) {
                        openModal(imgIndex);
                    }
                });

                sphereWorld.appendChild(card);
                spherePoints.push({
                    el: card,
                    nx: baseNormX,
                    ny: baseNormY,
                    nz: baseNormZ
                });
            }
        }

        function update3DSphere() {
            const { radius } = getSphereConfig();

            if (!isDragging) {
                velX *= 0.96;
                velY *= 0.96;
                if (Math.abs(velY) < 0.25) velY = 0.25;
                if (Math.abs(velX) < 0.05) velX = 0.05;

                rotY += velY;
                rotX += velX;
            }

            const radY = (rotY * Math.PI) / 180;
            const radX = (rotX * Math.PI) / 180;

            const cosY = Math.cos(radY);
            const sinY = Math.sin(radY);
            const cosX = Math.cos(radX);
            const sinX = Math.sin(radX);

            spherePoints.forEach(pt => {
                const x1 = pt.nx * cosY + pt.nz * sinY;
                const z1 = -pt.nx * sinY + pt.nz * cosY;
                const y1 = pt.ny;

                const y2 = y1 * cosX - z1 * sinX;
                const z2 = y1 * sinX + z1 * cosX;
                const x2 = x1;

                const worldX = x2 * radius;
                const worldY = y2 * radius;
                const worldZ = z2 * radius;

                const depthNorm = (worldZ + radius) / (2 * radius);
                const scale = 0.75 + depthNorm * 0.35;
                const opacity = 0.35 + depthNorm * 0.65;

                pt.el.style.zIndex = Math.round(worldZ + radius);
                pt.el.style.opacity = opacity;
                pt.el.style.transform = `translate3d(${worldX}px, ${worldY}px, ${worldZ}px) scale(${scale})`;
            });

            requestAnimationFrame(update3DSphere);
        }

        sphereStage.addEventListener('pointerdown', (e) => {
            isDragging = true;
            startPointerX = e.clientX;
            startPointerY = e.clientY;
            prevPointerX = e.clientX;
            prevPointerY = e.clientY;
        });

        window.addEventListener('pointermove', (e) => {
            if (isDragging) {
                const deltaX = e.clientX - prevPointerX;
                const deltaY = e.clientY - prevPointerY;

                rotY += deltaX * 0.4;
                rotX -= deltaY * 0.4;

                velY = deltaX * 0.3;
                velX = -deltaY * 0.3;

                prevPointerX = e.clientX;
                prevPointerY = e.clientY;
            }
        });

        window.addEventListener('pointerup', () => {
            isDragging = false;
        });

        window.addEventListener('pointercancel', () => {
            isDragging = false;
        });

        window.addEventListener('resize', () => {
            create3DSphere();
        });

        // ------------------------------------------------------------------------------
        // 🖼️ DYNAMIC GALLERY RENDERER (WHITE BACKGROUND IMAGE PART)
        // ------------------------------------------------------------------------------
        let currentModalIndex = 0;
        const grid = document.getElementById('photosGrid');
        const emptyState = document.getElementById('emptyState');
        const photoCountBadge = document.getElementById('photoCountBadge');

        function renderGallery() {
            if (!photoshootImages || photoshootImages.length === 0) {
                grid.innerHTML = '';
                emptyState.classList.remove('hidden');
                photoCountBadge.textContent = '0 Photos';
                return;
            }

            emptyState.classList.add('hidden');
            photoCountBadge.textContent = `${photoshootImages.length} Curated Photos`;

            // 4-Column Studio Catalog Layout (Images only, clean studio backdrop)
            grid.innerHTML = photoshootImages.map((src, index) => {
                return `
                    <div class="group flex flex-col cursor-pointer select-none" data-photo-index="${index}" role="button" tabindex="0" aria-label="Open photo ${index + 1}">
                        <!-- Studio Image Container (Light Gray Studio Backdrop, 4:5 Aspect Ratio) -->
                        <div class="w-full aspect-[608/760] bg-[#f2f2f2] overflow-hidden flex items-center justify-center transition-all duration-300 group-hover:opacity-95">
                            <img src="${escapeHTML(src)}"
                                 alt="${escapeHTML(activePhotos[index]?.alt || activePhotos[index]?.title || `Product shoot ${index + 1}`)}"
                                 loading="lazy"
                                 class="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.02]" />
                        </div>
                    </div>
                `;
            }).join('');
        }

        // ------------------------------------------------------------------------------
        // 🔍 LIGHTBOX / FULLSCREEN MODAL
        // ------------------------------------------------------------------------------
        const modal = document.getElementById('lightboxModal');
        const modalImage = document.getElementById('modalImage');
        const modalCounter = document.getElementById('modalCounter');
        const closeModalBtn = document.getElementById('closeModalBtn');
        const prevModalBtn = document.getElementById('prevModalBtn');
        const nextModalBtn = document.getElementById('nextModalBtn');

        function openModal(index) {
            currentModalIndex = index;
            updateModalImage();
            modal.classList.remove('hidden');
            setTimeout(() => {
                modal.classList.remove('opacity-0');
            }, 10);
            document.body.style.overflow = 'hidden';
        }

        function closeModal() {
            modal.classList.add('opacity-0');
            setTimeout(() => {
                modal.classList.add('hidden');
                document.body.style.overflow = '';
            }, 300);
        }

        function updateModalImage() {
            if (photoshootImages.length === 0) return;
            const src = photoshootImages[currentModalIndex];
            modalImage.src = src;
            modalCounter.textContent = `${currentModalIndex + 1} / ${photoshootImages.length}`;
        }

        function nextPhoto() {
            currentModalIndex = (currentModalIndex + 1) % photoshootImages.length;
            updateModalImage();
        }

        function prevPhoto() {
            currentModalIndex = (currentModalIndex - 1 + photoshootImages.length) % photoshootImages.length;
            updateModalImage();
        }

        closeModalBtn.addEventListener('click', closeModal);
        nextModalBtn.addEventListener('click', (e) => { e.stopPropagation(); nextPhoto(); });
        prevModalBtn.addEventListener('click', (e) => { e.stopPropagation(); prevPhoto(); });

        modal.addEventListener('click', (e) => {
            if (e.target === modal || e.target.classList.contains('relative')) {
                closeModal();
            }
        });

        document.addEventListener('keydown', (e) => {
            if (!modal.classList.contains('hidden')) {
                if (e.key === 'Escape') closeModal();
                if (e.key === 'ArrowRight') nextPhoto();
                if (e.key === 'ArrowLeft') prevPhoto();
            }
        });

        // Initialize on load
        (() => {
            create3DSphere();
            requestAnimationFrame(update3DSphere);
            renderGallery();
        })();
    
const openFromGrid = event => { const card=event.target.closest('[data-photo-index]'); if(card)openModal(Number(card.dataset.photoIndex)); };
grid.addEventListener('click',openFromGrid);
grid.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();openFromGrid(event);}});
const albums=[...new Set(publishedPhotos.map(item=>item.album).filter(Boolean))];
if(albums.length){const label=document.createElement('label');label.className='cms-album-filter';label.textContent='Album ';const select=document.createElement('select');select.setAttribute('aria-label','Photo album');select.add(new Option('All albums',''));albums.forEach(album=>select.add(new Option(album,album)));select.addEventListener('change',()=>{activePhotos=publishedPhotos.filter(item=>!select.value||item.album===select.value);photoshootImages=activePhotos.map(item=>safeURL(item.image_url,{image:true}));currentModalIndex=0;create3DSphere();renderGallery();});label.append(select);grid.before(label);}
