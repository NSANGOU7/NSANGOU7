import React from 'react';

// WhatsApp number — change this to user's real number (no +, no spaces, country code first)
// Example for France: 33612345678
const WHATSAPP_NUMBER = '33612345678';
const WHATSAPP_MESSAGE = 'Bonjour, je suis intéressé par une pièce sur AutoParts';

const WhatsAppButton = () => {
  const href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      data-testid="whatsapp-floating-btn"
      aria-label="Contacter sur WhatsApp"
      className="fixed bottom-6 left-6 z-40 w-14 h-14 rounded-full bg-[#25D366] hover:bg-[#1EBE5B] shadow-lg flex items-center justify-center transition-transform hover:scale-110"
    >
      <svg viewBox="0 0 32 32" className="w-7 h-7" fill="white">
        <path d="M16.003 3C9.374 3 4 8.374 4 15.003c0 2.378.692 4.6 1.886 6.467L4 28l6.71-1.853a11.94 11.94 0 0 0 5.293 1.27h.005C22.633 27.417 28 22.044 28 15.413 28 12.2 26.748 9.18 24.46 6.892A11.93 11.93 0 0 0 16.003 3zm0 21.83h-.004a9.95 9.95 0 0 1-5.067-1.388l-.363-.215-3.78 1.045 1.013-3.682-.236-.378a9.93 9.93 0 0 1-1.524-5.31C6.042 9.5 10.512 5.03 16.005 5.03c2.668 0 5.175 1.04 7.06 2.927a9.92 9.92 0 0 1 2.928 7.054c-.002 5.49-4.473 9.962-9.99 9.962zm5.467-7.46c-.3-.15-1.77-.873-2.044-.973-.273-.1-.473-.15-.673.15s-.772.973-.946 1.173c-.174.2-.348.225-.648.075s-1.265-.466-2.41-1.487c-.89-.795-1.49-1.776-1.665-2.076-.174-.3-.018-.46.13-.61.134-.133.298-.348.448-.522.15-.174.2-.298.299-.498.1-.2.05-.373-.025-.523-.074-.15-.673-1.622-.922-2.221-.243-.583-.49-.504-.673-.514l-.572-.01a1.1 1.1 0 0 0-.797.374c-.273.298-1.045 1.022-1.045 2.493s1.07 2.892 1.22 3.09c.15.2 2.105 3.213 5.1 4.503.713.308 1.27.492 1.704.63.715.227 1.366.195 1.88.118.574-.085 1.77-.723 2.02-1.422.25-.7.25-1.298.175-1.422-.073-.124-.273-.198-.572-.348z"/>
      </svg>
    </a>
  );
};

export default WhatsAppButton;
