import mariaImg from '../assets/dentists/maria_santos.jpg';
import joseImg from '../assets/dentists/jose_ramirez.jpg';
import patriciaImg from '../assets/dentists/patricia_tan.jpg';
import miguelImg from '../assets/dentists/miguel_fernandez.jpg';

const DENTIST_IMAGES = {
  'maria-santos': mariaImg,
  'jose-ramirez': joseImg,
  'patricia-tan': patriciaImg,
  'miguel-fernandez': miguelImg,
};

/**
 * Returns a high-resolution portrait image for a given dentist.
 * Matches by name, specialization, or returns a standard fallback.
 *
 * @param {object} dentist
 * @returns {string} Image URL or asset import
 */
export function getDentistPortrait(dentist) {
  if (!dentist) return mariaImg;

  if (dentist.photo || dentist.avatar || dentist.image) {
    return dentist.photo || dentist.avatar || dentist.image;
  }

  const name = [dentist.firstName, dentist.lastName, dentist.fullName, dentist.name]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  if (name.includes('maria') || name.includes('santos')) {
    return DENTIST_IMAGES['maria-santos'];
  }
  if (name.includes('jose') || name.includes('ramirez') || name.includes('reyes')) {
    return DENTIST_IMAGES['jose-ramirez'];
  }
  if (name.includes('patricia') || name.includes('tan')) {
    return DENTIST_IMAGES['patricia-tan'];
  }
  if (name.includes('miguel') || name.includes('fernandez') || name.includes('garcia')) {
    return DENTIST_IMAGES['miguel-fernandez'];
  }

  // Fallback by specialization
  const spec = (dentist.specialization || '').toLowerCase();
  if (spec.includes('general')) return DENTIST_IMAGES['maria-santos'];
  if (spec.includes('ortho')) return DENTIST_IMAGES['jose-ramirez'];
  if (spec.includes('endo')) return DENTIST_IMAGES['patricia-tan'];
  if (spec.includes('pediatric') || spec.includes('cosmetic')) return DENTIST_IMAGES['miguel-fernandez'];

  return DENTIST_IMAGES['maria-santos'];
}

export const DENTIST_PRESET_OPTIONS = [
  { id: 'maria', label: 'Dr. Santos (General)', image: mariaImg },
  { id: 'jose', label: 'Dr. Ramirez (Ortho)', image: joseImg },
  { id: 'patricia', label: 'Dr. Tan (Endo)', image: patriciaImg },
  { id: 'miguel', label: 'Dr. Fernandez (Pediatric/Cosmetic)', image: miguelImg },
];

/**
 * Reads and scales an image file to a lightweight data URL (max 400x400 JPEG).
 * Keeps uploads crisp, instant, and lightweight for MongoDB and web display.
 *
 * @param {File} file
 * @param {number} [maxDimension=400]
 * @param {number} [quality=0.88]
 * @returns {Promise<string>}
 */
export function processProfileImageFile(file, maxDimension = 400, quality = 0.88) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) {
      return reject(new Error('Please select an image file (JPEG, PNG, WEBP).'));
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error('Failed to parse image file.'));
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.readAsDataURL(file);
  });
}

export default getDentistPortrait;
