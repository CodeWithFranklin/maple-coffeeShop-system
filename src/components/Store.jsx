import { NavLink } from "react-router-dom";
import { useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { usePrevNextButtons } from "./hooks/usePrevNextButtons";
import { NextButton, PrevButton } from "./embela/EmblaCarouselArrowButtons";
import { locations, locatedStores } from "./ListItems";
export default function Store() {
  const [selected, setSelected] = useState("Select Location");

  const handleSelect = (label) => {
    setSelected(label);

    // DaisyUI dropdowns stay open because of focus.
    // This line "blurs" the current element to force the menu to close.
    document.activeElement.blur();
  };
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const {
    prevBtnDisabled,
    nextBtnDisabled,
    onPrevButtonClick,
    onNextButtonClick,
  } = usePrevNextButtons(emblaApi);

  const slides = [1, 2, 3, 4, 5];
  return (
    <section className="min-h-screen flex flex-col">
      <div className="mx-18 mt-13">
        <h1 className="text-7xl font-extrabold mb-13 leading-[1.2]">
          Discover wonderful maple stores near{" "}
          <span className="text-lime-300">you!</span>
        </h1>
        <div className="flex gap-x-3">
          <div className="lg:w-200">
            <div className="mb-6 w-fit mx-auto">
              <ul className="steps font-bold ">
                <li className="step step-primary">Select store</li>
                <li className="step">Select Product</li>
                <li className="step">Purchase</li>
                <li className="step">Receive Product</li>
              </ul>
            </div>
            <h3 className="font-semibold mb-1">
              <i className="bx bxs-map"></i> Location
            </h3>
            <div className="dropdown group mb-10">
              {/* The Trigger Button */}
              <div
                tabIndex={0}
                role="button"
                className="btn m-1 text-[16px] flex justify-between w-fit border-0 bg-white border-gray-300 hover:bg-gray-50 text-black"
              >
                {selected}

                {/* The Chevron Icon */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-4 h-4 transition-transform duration-300 group-focus-within:rotate-180"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m19.5 8.25-7.5 7.5-7.5-7.5"
                  />
                </svg>
              </div>

              {/* The Menu Content */}
              <ul
                tabIndex={0}
                className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-64 border border-base-200"
              >
                {locations.map((location) => (
                  <li key={location.id}>
                    <a onClick={() => handleSelect(location.label)}>
                      {location.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-3">Select Store</h4>
              {locatedStores.map((store) => (
                <div
                  key={store.id}
                  className="flex items-center justify-between border-1 border-gray-400 min-h-22 w-full rounded-full px-5 py-3 mb-5"
                >
                  <div className="min-w-40 max-w-75 flex h-fit gap-x-1">
                    <div className="avatar avatar-placeholder">
                      <div className="bg-neutral text-neutral-content w-10 h-10 rounded-full">
                        <span>SY</span>
                      </div>
                    </div>
                    <div className="text-sm">
                      <p className="font-bold">{store.name}</p>
                      <p>{store.address}</p>
                    </div>
                  </div>
                  <div className="flex gap-x-2">
                    <button className="btn btn- h-9 border-0 rounded-3xl border-1 border-gray-400">
                      Preview Store
                    </button>
                    <NavLink to="/order" className="btn btn- h-9 border-0 rounded-3xl border-1 border-gray-400">
                      Order Here
                    </NavLink>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="lg:w-100 mx-auto">
            {/* THE STICKY WRAPPER: This stays still on the page */}
            <div className="card bg-base-100 w-80 shadow-sm sticky top-10 self-start translate-y-20 translate-x-10 h-fit">
              {/* THE VIEWPORT: The Embla Ref goes on the figure (the window) */}
              <figure
                className="relative overflow-hidden rounded-t-2xl h-60"
                ref={emblaRef}
              >
                {/* THE CONTAINER: This is the long strip of images */}
                <div className="flex w-full h-full">
                  {slides.map((id) => (
                    <div key={id} className="flex-[0_0_100%] min-w-0 h-full">
                      <img
                        src="https://img.daisyui.com/images/stock/photo-1606107557195-0e29a4b5b4aa.webp"
                        className="w-full h-full object-cover"
                        alt={`Slide ${id}`}
                      />
                    </div>
                  ))}
                </div>

                {/* THE BUTTONS: Positioned absolute over the image */}
                <div className="absolute inset-0 flex items-center justify-between px-2 pointer-events-none">
                  <div className="pointer-events-auto">
                    <PrevButton
                      onClick={onPrevButtonClick}
                      disabled={prevBtnDisabled}
                      className="touch-manipulation btn aspect-square w-10 px-0 flex justify-center items-center rounded-full cursor-pointer shadow opacity-70"
                    />
                  </div>
                  <div className="pointer-events-auto">
                    <NextButton
                      onClick={onNextButtonClick}
                      disabled={nextBtnDisabled}
                      className="touch-manipulation btn aspect-square w-10 px-0 flex justify-center items-center rounded-full cursor-pointer shadow opacity-70"
                    />
                  </div>
                </div>
              </figure>

              {/* THE STATIC CONTENT: This never moves */}
              <div className="card-body">
                <h2 className="card-title">Maple Store Gallery</h2>
                <p>
                  The images above slide, but this text and the "Buy Now" button
                  stay exactly where they are.
                </p>
                <div className="card-actions justify-end">
                  <button className="btn btn-primary">Buy Now</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
