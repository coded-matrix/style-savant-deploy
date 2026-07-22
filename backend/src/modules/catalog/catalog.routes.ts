import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import * as controller from './catalog.controller';

const router = Router();

router.get('/art-styles', controller.getArtStyles);
router.get('/preset-models', controller.getPresetModels);
router.get('/artists', controller.getArtists);
router.get('/backdrops', controller.getBackdrops);
router.get('/vendors', controller.getVendors);
router.get('/products', controller.getProducts);
router.get('/products/:id', controller.getProductById);
router.get('/looks', controller.getLooks);
router.post('/tryon', authenticate, controller.generateTryOn);
router.get('/tryon/gallery', authenticate, controller.listGallery);
router.delete('/tryon/gallery/:id', authenticate, controller.deleteGalleryItem);

export default router;
