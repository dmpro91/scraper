export const tryCatch = async (asyncCallback: () => unknown) => {
    try {
      return await asyncCallback();
    } catch (error) {
        console.error(error);
      return null;
    }
  };