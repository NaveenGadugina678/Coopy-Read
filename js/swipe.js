export function attachSwipe(card, {onCommit,onCancel}){
  let startX=0,startY=0,currentX=0,dragging=false,locked=false;
  const threshold = Math.min(150, Math.max(80, card.parentElement.clientWidth * .22));

  const down = e => {
    if (locked) return;
    const point = e.touches ? e.touches[0] : e;
    startX = point.clientX; startY = point.clientY; currentX = 0; dragging = true;
    card.classList.add("dragging");
    if (e.pointerId && card.setPointerCapture) card.setPointerCapture(e.pointerId);
  };
  const move = e => {
    if (!dragging || locked) return;
    const point = e.touches ? e.touches[0] : e;
    currentX = point.clientX - startX;
    const dy = point.clientY - startY;
    if (Math.abs(currentX) > Math.abs(dy) * 1.1) {
      if (e.cancelable) e.preventDefault();
      const rotate = currentX / 26;
      card.style.transform = `translateX(${currentX}px) rotate(${rotate}deg)`;
    }
  };
  const up = () => {
    if (!dragging || locked) return;
    dragging=false; card.classList.remove("dragging");
    if (Math.abs(currentX) >= threshold) {
      locked=true;
      onCommit(currentX > 0 ? "right" : "left");
    } else {
      card.style.transform="";
      onCancel?.();
    }
  };

  card.addEventListener("pointerdown", down);
  card.addEventListener("pointermove", move, {passive:false});
  card.addEventListener("pointerup", up);
  card.addEventListener("pointercancel", up);
  card.addEventListener("touchstart", down, {passive:true});
  card.addEventListener("touchmove", move, {passive:false});
  card.addEventListener("touchend", up);
}