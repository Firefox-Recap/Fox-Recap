function BackgroundSlider({ setView, dayPrompt }) {
    const [currentImage, setCurrentImage] = useState(0);

    useEffect(() => {
        const intervalId = setInterval(() => {
            setCurrentImage(prevIndex => (prevIndex + 1) % backgroundImages.length);
        }, 10000);

        return () => clearInterval(intervalId);
    }, []);

    const handleBackgroundClick = (e) => {
        if (!e.target.classList.contains('no-exit')) {
            setView('home');
        }
    };

    return (
        <div
            onClick={handleBackgroundClick}
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                backgroundImage: `url(${backgroundImages[currentImage]})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                transition: 'background-image 0.5s ease-in-out'
            }}
        >
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    setView('home');
                }}
                className="no-exit"
                style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    zIndex: 1000,
                    background: 'transparent',
                    border: 'none',
                    fontSize: '40px',
                    color: '#fff',
                    cursor: 'pointer'
                }}
            >
                x
            </button>

            {/* Display the passed day prompt */}
            <h1 style={{ color: "#fff", textAlign: "center", marginTop: "300px" }}>
                {dayPrompt}
            </h1>
        </div>
    );
}

export default BackgroundSlider;
