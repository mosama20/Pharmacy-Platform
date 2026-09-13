import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProductCard } from './ProductCard';
import * as CartContextModule from '../../context/CartContext';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

describe('ProductCard (Component Tests with React Testing Library)', () => {
  const mockProduct = {
    id: 'prod_card_1',
    nameAr: 'بانادول إكسترا أقراص',
    nameEn: 'Panadol Extra Tablets',
    activeIngredient: 'Paracetamol',
    price: 52,
    originalPrice: 60,
    discountPercentage: 15,
    isPrescriptionRequired: true,
    image: 'panadol.jpg',
  };

  it('should render product name, price, and badges correctly', () => {
    vi.spyOn(CartContextModule, 'useCart').mockReturnValue({
      addToCart: vi.fn(),
    });

    render(<ProductCard product={mockProduct} />);

    expect(screen.getByText('بانادول إكسترا أقراص')).toBeInTheDocument();
    expect(screen.getByText(/52/)).toBeInTheDocument();
    expect(screen.getByText(/خصم 15%/)).toBeInTheDocument();
    expect(screen.getByText('روشتة')).toBeInTheDocument();
    expect(screen.getByText('Paracetamol')).toBeInTheDocument();
  });

  it('should call addToCart when clicking the add to cart button', async () => {
    const user = userEvent.setup();
    const addToCartMock = vi.fn();
    vi.spyOn(CartContextModule, 'useCart').mockReturnValue({
      addToCart: addToCartMock,
    });

    render(<ProductCard product={mockProduct} />);

    const addButton = screen.getByRole('button', { name: /أضف للسلة|أضف/i });
    await act(async () => {
      await user.click(addButton);
    });

    expect(addToCartMock).toHaveBeenCalledWith(mockProduct, 1);
  });

  it('should navigate to product details on card click when onQuickView is not provided', async () => {
    const user = userEvent.setup();
    vi.spyOn(CartContextModule, 'useCart').mockReturnValue({
      addToCart: vi.fn(),
    });

    const { container } = render(<ProductCard product={mockProduct} />);
    const card = container.firstChild;

    await user.click(card);

    expect(mockNavigate).toHaveBeenCalledWith('/product/prod_card_1');
  });
});
