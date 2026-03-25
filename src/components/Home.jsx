import React, { useEffect, useState } from "react";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { usePrevNextButtons } from "./hooks/usePrevNextButtons";
import { useVerticalCarousel } from "./hooks/useVerticalCarousel";
import { NextButton, PrevButton } from "./embela/EmblaCarouselArrowButtons";
import { menuList, feedBack } from "./ListItems.js";

export default function Home() {
  // 1. Carousel Initializations
  const [horizontalaRef, horizontalApi] = useEmblaCarousel({ loop: true });
  const [verticalRef, verticalApi] = useEmblaCarousel(
    { axis: "y", loop: true },
    [Autoplay({ delay: 5000 })]
  );

  // 2. Hook Connections
  const { selectedIndex, scrollSnaps, scrollTo } =
    useVerticalCarousel(verticalApi);
  const {
    prevBtnDisabled,
    nextBtnDisabled,
    onPrevButtonClick,
    onNextButtonClick,
  } = usePrevNextButtons(horizontalApi);

  // 3. State Management
  const images = ["/images/coffee.jpg", "/images/pizza.jpg"];
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // 4. Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 5. THE FIX: Guard Clause for Loading State
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-purple-50">
        <span className="loading loading-spinner loading-lg text-purple-600"></span>
      </div>
    );
  }

  // 6. Main Render
  return (
    <section className="bg-purple-50">
      <div className="min-h-[570px] pt-7 sm:pt-10">
        {/* HERO SECTION */}
        <section className="flex flex-col lg:flex-row sm:ps-10 lg:justify-between max-w-screen-xl mx-auto px-5 gap-y-10">
          <div className="min-h-full lg:w-fit">
            <div className="lg:w-150 sm:w-150 w-full">
              <p className="lg:text-[100px] text-5xl md:text-6xl font-extrabold leading-[1.2]">
                Get the best of your day from us!
              </p>
              <div className="lg:w-[92%] w-[92%] text-gray-500">
                <p className="text-xl mt-6 font-semibold">
                  The flavour, the comfort, the moments that you deserve.
                </p>
                <p>save up to 20% off your first order.</p>
              </div>
              <div className="badge py-[23px] font-semibold px-5 mt-6 bg-lime-300 rounded-3xl border-0">
                <a href="/services" className="flex items-center gap-2">
                  Our Services?
                  <span className="avatar rounded-full bg-blue-400 w-9 h-9 flex justify-center items-center">
                    <i className="bx bx-right-top-arrow-circle bx-sm"></i>
                  </span>
                </a>
              </div>
            </div>
          </div>

          {/* WEEKLY PICK CARD */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-7 w-full lg:items-end">
            <div className="bg-blue-300 max-w-85 sm:w-80 flex-1 rounded-4xl relative ps-5 overflow-hidden flex flex-col justify-center min-h-[250px]">
              <div className="lg:text-4xl text-3xl font-extrabold w-[45%]">
                <p className="text-white">weekly pick!</p>
                <p className="text-yellow-400 mt-2">13$</p>
              </div>
              <img
                src="/images/ad-image-2.png"
                className="w-52 absolute right-[-10px] bottom-0"
                alt="bread"
              />
              <div className="flex gap-x-2 mt-3">
                <button className="btn btn-sm rounded-2xl border-0 font-bold">
                  Explore
                </button>
                <button className="btn btn-sm btn-circle bg-lime-300 border-0">
                  <i className="bx bx-heart"></i>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* VERTICAL CAROUSEL SECTION */}
        <section className="mt-20 max-w-[95%] lg:max-w-[80%] mx-auto bg-white shadow-xl rounded-4xl p-10 flex flex-col md:flex-row gap-10">
          <div className="md:w-[40%]">
            <div
              className="w-full h-[270px] overflow-hidden rounded-3xl relative"
              ref={verticalRef}
            >
              <div className="flex flex-col h-full">
                {images.map((src, index) => (
                  <div key={index} className="flex-[0_0_100%] h-full">
                    <img
                      src={src}
                      className="object-cover w-full h-full"
                      alt="carousel"
                    />
                  </div>
                ))}
              </div>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex flex-col gap-2">
                {scrollSnaps.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => scrollTo(index)}
                    className={`w-3 h-3 rounded-full transition-all ${
                      index === selectedIndex
                        ? "bg-white scale-125"
                        : "bg-gray-400/70"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
          <div className="md:w-[60%]">
            <h2 className="text-4xl font-extrabold">
              Book your experience today!
            </h2>
            <p className="text-gray-600 mt-4">
              Choose from dining, workspace, lounge or spa with our flexible
              booking slots.
            </p>
            <button className="btn bg-lime-300 rounded-4xl mt-6 border-0">
              Book a space! <i className="bx bx-right-arrow-alt ms-2"></i>
            </button>
          </div>
        </section>

        {/* FEEDBACK HORIZONTAL CAROUSEL */}
        <section className="mt-25 max-w-screen-xl mx-auto px-5">
          <h2 className="text-5xl font-extrabold mb-10">loved by many! 🤩</h2>
          <div className="overflow-hidden" ref={horizontalaRef}>
            <div className="flex gap-6">
              {feedBack.map((slide) => (
                <div
                  key={slide.id}
                  className="flex-[0_0_320px] bg-blue-300 p-6 rounded-4xl min-h-[220px]"
                >
                  <p className="text-2xl font-bold h-24 line-clamp-3">
                    {slide.review}
                  </p>
                  <div className="flex items-center mt-4">
                    <div className="w-10 h-10 rounded-full bg-white mr-3"></div>
                    <p className="font-bold">{slide.name}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-center gap-10 mt-8">
            <PrevButton
              onClick={onPrevButtonClick}
              disabled={prevBtnDisabled}
            />
            <NextButton
              onClick={onNextButtonClick}
              disabled={nextBtnDisabled}
            />
          </div>
        </section>
      </div>
    </section>
  );
}
