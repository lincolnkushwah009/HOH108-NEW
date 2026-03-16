import { useState } from 'react';
import { FaStar, FaChevronLeft, FaChevronRight, FaQuoteLeft, FaPlay } from 'react-icons/fa';

const Testimonials = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const videoTestimonials = [
    { id: 'agFFhUIOQz4', title: 'Customer Testimonial' },
    { id: 'jlpRZPGg5M4', title: 'Customer Testimonial' },
  ];

  const testimonials = [
    { name: 'Bharath Bharu', location: 'Bangalore', rating: 5, text: 'Best Interior Firm in Bangalore! When I was about to finalise other firm I just received a call from Interior Plus and after having a conversation with them, me and my family decided to check with them once! And that\'s the best thing I have done for my dream house because they helped us a lot from getting best quality to superb designs which makes me feel very super cool. Thank you for the approach and attractive work.', image: 'https://ui-avatars.com/api/?name=Bharath+Bharu&background=C59C82&color=111111&size=200' },
    { name: 'Archana Subramanian', location: 'Bangalore', rating: 5, text: 'Had a nice experience with IP design & sales team. They are very responsive to all queries and the design team tries to bring out the picture in mind into reality. 3D design views gives a cozy experience. The materials as well looks to be of good quality. Happy to have chosen IP for our house interior work.', image: 'https://ui-avatars.com/api/?name=Archana+Subramanian&background=C59C82&color=111111&size=200' },
    { name: 'Vinoth Nagarajan', location: 'Bangalore', rating: 5, text: 'Interior Plus has been a good experience so far from the start. Their hospitality, marketing and the Design expertise has been really note worthy. Particularly very impressed with the work & designs of Lead Designer Naga Sai Lokesh, who is really patient and skilled at work. Have committed and signed on a project with them – Having full hopes that it would come out well so we can refer IP to our visitors proudly.', image: 'https://ui-avatars.com/api/?name=Vinoth+Nagarajan&background=C59C82&color=111111&size=200' },
  ];

  const nextTestimonial = () => setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  const prevTestimonial = () => setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);

  return (
    <section style={{ backgroundColor: '#1A1A1A', padding: '64px 0' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 16px' }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <h2 className="font-heading" style={{ fontSize: '2rem', fontWeight: 'bold', color: '#E5E5E5', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Happy <span style={{ color: '#C59C82' }}>Homeowners</span>
          </h2>
          <p style={{ color: '#A1A1A1', maxWidth: '672px', margin: '0 auto' }}>
            Don't just take our word for it. Here's what our customers have to say about us.
          </p>
        </div>

        {/* Video Testimonials */}
        <div style={{ marginBottom: '64px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '32px' }}>
            <FaPlay style={{ color: '#C59C82', fontSize: '1rem' }} />
            <h3 className="font-heading" style={{ fontSize: '1.25rem', fontWeight: '600', color: '#E5E5E5', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Video Testimonials
            </h3>
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '24px',
            maxWidth: '900px',
            margin: '0 auto'
          }}>
            {videoTestimonials.map((video, index) => (
              <div
                key={video.id}
                style={{
                  backgroundColor: '#111111',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  border: '1px solid rgba(197, 156, 130, 0.2)',
                  transition: 'transform 0.3s ease, box-shadow 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 10px 40px rgba(197, 156, 130, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0 }}>
                  <iframe
                    src={`https://www.youtube.com/embed/${video.id}`}
                    title={`${video.title} ${index + 1}`}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%'
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Google Rating */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '48px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#111111', padding: '12px 24px', borderRadius: '50px', border: '1px solid rgba(197, 156, 130, 0.2)' }}>
            <span style={{ fontWeight: '600', color: '#E5E5E5' }}>Google</span>
            <div style={{ display: 'flex', gap: '2px' }}>
              {[...Array(5)].map((_, i) => <FaStar key={i} style={{ color: '#facc15' }} />)}
            </div>
            <span style={{ fontWeight: '600', color: '#E5E5E5' }}>4.9</span>
            <span style={{ color: '#A1A1A1' }}>(200+ reviews)</span>
          </div>
        </div>

        {/* Testimonial Card */}
        <div style={{ maxWidth: '768px', margin: '0 auto' }}>
          <div style={{ backgroundColor: '#111111', borderRadius: '16px', padding: '32px', border: '1px solid rgba(197, 156, 130, 0.1)' }}>
            <FaQuoteLeft style={{ fontSize: '2rem', color: 'rgba(197, 156, 130, 0.2)', marginBottom: '24px' }} />

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px', textAlign: 'center' }}>
              <img
                src={testimonials[currentIndex].image}
                alt={testimonials[currentIndex].name}
                style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '4px solid #C59C82' }}
              />
              <div>
                <p style={{ fontSize: '1.125rem', color: '#E5E5E5', marginBottom: '16px' }}>
                  "{testimonials[currentIndex].text}"
                </p>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '4px', marginBottom: '8px' }}>
                  {[...Array(testimonials[currentIndex].rating)].map((_, i) => <FaStar key={i} style={{ color: '#facc15' }} />)}
                </div>
                <h4 className="font-heading" style={{ fontWeight: 'bold', color: '#E5E5E5' }}>{testimonials[currentIndex].name}</h4>
                <p style={{ color: '#A1A1A1' }}>{testimonials[currentIndex].location}</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', marginTop: '32px' }}>
            <button onClick={prevTestimonial} style={{ width: '48px', height: '48px', backgroundColor: '#111111', border: '1px solid rgba(197, 156, 130, 0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#A1A1A1', cursor: 'pointer' }}>
              <FaChevronLeft />
            </button>
            <div style={{ display: 'flex', gap: '8px' }}>
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  style={{ width: '12px', height: '12px', borderRadius: '50%', border: 'none', cursor: 'pointer', backgroundColor: currentIndex === index ? '#C59C82' : 'rgba(197, 156, 130, 0.3)' }}
                />
              ))}
            </div>
            <button onClick={nextTestimonial} style={{ width: '48px', height: '48px', backgroundColor: '#111111', border: '1px solid rgba(197, 156, 130, 0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#A1A1A1', cursor: 'pointer' }}>
              <FaChevronRight />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
