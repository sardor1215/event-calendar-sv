import { useEffect } from "react";

const ProgressBar = () => {
  useEffect(() => {
    const loading = document.querySelector(".loading");
    let currentProgress = 0;
    const itv = setInterval(function () {
      if (currentProgress < 100) {
        const increment = Math.random() * 40;
        currentProgress += increment;
        if (currentProgress > 100) currentProgress = 100;
        setProgress(currentProgress);
      } else {
        clearInterval(itv);
      }
    }, 800);

    function setProgress(progress) {
      loading.style.width = `${progress}%`;
    }

    return () => clearInterval(itv);
  }, []);

  return (
    <div className="loading h-1.5 w-[0%] mt-0.5 bg-blue-600 transition-all duration-200 relative z-40 top-0 rounded-r-lg"></div>
  );
};

export default ProgressBar;
