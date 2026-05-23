import { useState, useEffect } from 'react';
import { slideService } from '../services/index.js';

/**
 * Hook fetch dữ liệu một slide theo ID (bao gồm populated terms)
 */
export function useSlide(slideId) {
  const [state, setState] = useState({
    slide: null,
    error: null,
    slideId: null,
  });

  useEffect(() => {
    if (!slideId) return;
    let ignore = false;

    slideService
      .getById(slideId)
      .then((res) => {
        if (!ignore) {
          setState({ slide: res.data, error: null, slideId });
        }
      })
      .catch((err) => {
        if (!ignore) {
          setState({
            slide: null,
            error: err?.message || 'Failed to load slide',
            slideId,
          });
        }
      });

    return () => {
      ignore = true;
    };
  }, [slideId]);

  const isCurrent = state.slideId === slideId;
  const loading = Boolean(slideId && !isCurrent);
  const slide = isCurrent ? state.slide : null;
  const error = isCurrent ? state.error : null;

  return { slide, loading, error };
}

/**
 * Hook fetch danh sách tất cả slides
 */
export function useSlides() {
  const [slides, setSlides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    slideService
      .getAll()
      .then((res) => setSlides(res.data))
      .catch((err) => setError(err?.message || 'Failed to load slides'))
      .finally(() => setLoading(false));
  }, []);

  return { slides, loading, error };
}
