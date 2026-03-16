import Header from '../components/Header';
import Footer from '../components/Footer';
import WhatsAppButton from '../components/WhatsAppButton';

const TermsAndConditions = () => {
  return (
    <div style={{ minHeight: '100vh' }}>
      <Header />
      <main style={{ backgroundColor: '#111111', padding: '64px 0' }}>
        <div style={{ maxWidth: '896px', margin: '0 auto', padding: '0 16px' }}>
          <h1 className="font-heading" style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#E5E5E5', marginBottom: '32px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Terms & <span style={{ color: '#C59C82' }}>Conditions</span>
          </h1>

          <div style={{ color: '#A1A1A1', lineHeight: '1.8' }}>
            <p style={{ marginBottom: '24px', color: '#E5E5E5' }}>
              Last updated: December 2024
            </p>

            {/* Price and Price Validity */}
            <section style={{ marginBottom: '32px' }}>
              <h2 className="font-heading" style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#E5E5E5', marginBottom: '16px', textTransform: 'uppercase' }}>
                Price and Price Validity
              </h2>
              <ul style={{ listStyle: 'disc', paddingLeft: '24px', marginBottom: '16px' }}>
                <li style={{ marginBottom: '8px' }}>This is an initial estimate, based on the Floor Plan and the requirements shared.</li>
                <li style={{ marginBottom: '8px' }}>The exact and final price of your project will depend on measurements, scope of work and change in designs/ material / finishes. Based on these revisions, you can expect the quote to raise or drop.</li>
                <li style={{ marginBottom: '8px' }}>To move forward with the development of measurement based designs, you will have to pay the booking amount of this estimate as a non-refundable advance.</li>
                <li style={{ marginBottom: '8px' }}>Minimum order value is INR 3,50,000. Orders below minimum order value will not be accepted.</li>
                <li style={{ marginBottom: '8px' }}>This estimate does not include civil, plumbing, gas-piping or electrical work.</li>
                <li style={{ marginBottom: '8px' }}>Back panels would be constructed of the same cabinet core material for all products.</li>
                <li style={{ marginBottom: '8px' }}>All shutters will have Hettich soft-close mechanism by default.</li>
                <li style={{ marginBottom: '8px' }}>The final payment has to be done on the day / within 2 days of delivery at the site and not after installation starts.</li>
                <li style={{ marginBottom: '8px' }}>Availability and pricing of all out of scope furnitures are subject to change between the booking and production stage.</li>
                <li style={{ marginBottom: '8px' }}>The total price includes installation, transportation, design charges and GST.</li>
                <li style={{ marginBottom: '8px' }}>The total price payable by you for the services shall be as per the final quotation sent to you by IP Home Furnishings Pvt Ltd (IP Home Furnishings Pvt Ltd (Interior Plus)) and accepted by you.</li>
                <li style={{ marginBottom: '8px' }}>The payment shall be made as per the following milestones (via cheque/demand draft/bank transfer (NEFT/RTGS/IMPS) only.</li>
              </ul>
            </section>

            {/* Payment Milestones */}
            <section style={{ marginBottom: '32px' }}>
              <h2 className="font-heading" style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#E5E5E5', marginBottom: '16px', textTransform: 'uppercase' }}>
                Payment Milestones
              </h2>
              <div style={{ backgroundColor: '#1A1A1A', borderRadius: '12px', border: '1px solid rgba(197, 156, 130, 0.1)', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: 'rgba(197, 156, 130, 0.1)' }}>
                      <th style={{ padding: '16px', textAlign: 'left', color: '#C59C82', fontWeight: '600', borderBottom: '1px solid rgba(197, 156, 130, 0.2)' }}>Milestone</th>
                      <th style={{ padding: '16px', textAlign: 'left', color: '#C59C82', fontWeight: '600', borderBottom: '1px solid rgba(197, 156, 130, 0.2)' }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ padding: '16px', borderBottom: '1px solid rgba(197, 156, 130, 0.1)', color: '#E5E5E5' }}>1st Milestone</td>
                      <td style={{ padding: '16px', borderBottom: '1px solid rgba(197, 156, 130, 0.1)' }}>
                        Rs.50,000/- (Against the Price upto 5,00,000/-)<br />
                        10% of the estimate value (Against the Price 5,00,001/- and above)
                      </td>
                    </tr>
                    <tr>
                      <td style={{ padding: '16px', borderBottom: '1px solid rgba(197, 156, 130, 0.1)', color: '#E5E5E5' }}>2nd Milestone</td>
                      <td style={{ padding: '16px', borderBottom: '1px solid rgba(197, 156, 130, 0.1)' }}>60% (sixty percent) of the Price (minus the booking amount)</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '16px', color: '#E5E5E5' }}>3rd Milestone</td>
                      <td style={{ padding: '16px' }}>40% (forty percent) of the Price</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* Bank Account Details */}
            <section style={{ marginBottom: '32px' }}>
              <h2 className="font-heading" style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#E5E5E5', marginBottom: '16px', textTransform: 'uppercase' }}>
                Bank Account Details
              </h2>
              <div style={{ backgroundColor: '#1A1A1A', padding: '24px', borderRadius: '12px', border: '1px solid rgba(197, 156, 130, 0.1)' }}>
                <p style={{ marginBottom: '8px' }}><strong style={{ color: '#C59C82' }}>Beneficiary Name:</strong> <span style={{ color: '#E5E5E5' }}>IP Home Furnishings Pvt Ltd</span></p>
                <p style={{ marginBottom: '8px' }}><strong style={{ color: '#C59C82' }}>Account Number:</strong> <span style={{ color: '#E5E5E5' }}>50200091357064</span></p>
                <p style={{ marginBottom: '8px' }}><strong style={{ color: '#C59C82' }}>Account Type:</strong> <span style={{ color: '#E5E5E5' }}>Current</span></p>
                <p style={{ marginBottom: '8px' }}><strong style={{ color: '#C59C82' }}>IFSC:</strong> <span style={{ color: '#E5E5E5' }}>HDFC0000523</span></p>
                <p><strong style={{ color: '#C59C82' }}>Bank Name:</strong> <span style={{ color: '#E5E5E5' }}>HDFC Bank</span></p>
              </div>
            </section>

            {/* Installation Checks */}
            <section style={{ marginBottom: '32px' }}>
              <h2 className="font-heading" style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#E5E5E5', marginBottom: '16px', textTransform: 'uppercase' }}>
                Installation Checks
              </h2>
              <p style={{ marginBottom: '16px' }}>
                Final coat of paint should be done after completion of interior work. If any civil work is done at site including false ceiling, electrical, plumbing, gas piping, wall demolition, wall partition etc, we will be unable to avoid handmarks and scratches during installation.
              </p>
            </section>

            {/* 45-Day Delivery Guarantee */}
            <section style={{ marginBottom: '32px' }}>
              <h2 className="font-heading" style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#E5E5E5', marginBottom: '16px', textTransform: 'uppercase' }}>
                45-Day Delivery Guarantee
              </h2>
              <ul style={{ listStyle: 'disc', paddingLeft: '24px', marginBottom: '16px' }}>
                <li style={{ marginBottom: '8px' }}>The Delivery Guarantee period will begin once you & your IP Home Furnishings Pvt Ltd (Interior Plus) project team gives a sign off on your final design, you have accepted the IP Home Furnishings Pvt Ltd (Interior Plus) Works Contract and your payment of second installment (60% of quote value) is received.</li>
                <li style={{ marginBottom: '8px' }}>If we don't complete your project within 45 days, we will pay you a compensation at the rate of Rs. 500 (Rupees Five Hundred) for every day of delay subject to the fulfilment of all the conditions for availing 45 days guarantee.</li>
                <li style={{ marginBottom: '8px' }}>Conditions for our 45 Day Promise: All items contained in the site-readiness checklist should be complete when we begin the installation process.</li>
              </ul>
            </section>

            {/* Upto 10-Years Warranty */}
            <section style={{ marginBottom: '32px' }}>
              <h2 className="font-heading" style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#E5E5E5', marginBottom: '16px', textTransform: 'uppercase' }}>
                Upto 10-Years Warranty
              </h2>
              <ul style={{ listStyle: 'disc', paddingLeft: '24px', marginBottom: '16px' }}>
                <li style={{ marginBottom: '8px' }}>All the woodwork is covered under the IP Home Furnishings Pvt Ltd (Interior Plus)' upto 10 years warranty. This safeguards you against any defect in manufacturing or in installation workmanship.</li>
                <li style={{ marginBottom: '8px' }}>All accessories, hardware and appliances are covered as per the respective Manufacturer's Warranty Policy.</li>
                <li style={{ marginBottom: '8px' }}>You can refer to the IP Home Furnishings Pvt Ltd (Interior Plus) Works Contract for a detailed description of our Warranty Policy.</li>
              </ul>
            </section>

            {/* Post-Handover Service */}
            <section style={{ marginBottom: '32px' }}>
              <h2 className="font-heading" style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#E5E5E5', marginBottom: '16px', textTransform: 'uppercase' }}>
                Post-Handover Service
              </h2>
              <ul style={{ listStyle: 'disc', paddingLeft: '24px', marginBottom: '16px' }}>
                <li style={{ marginBottom: '8px' }}>For any post-handover concerns, please raise your request through <a href="https://interiorplus.in/contact-us" style={{ color: '#C59C82', textDecoration: 'underline' }}>https://interiorplus.in/contact-us</a></li>
                <li style={{ marginBottom: '8px' }}>We provide one free-of-cost service visit to the site within 6 months of the handover. This is put in place to address routine services which cover moving parts like hinges, channels etc. Our Care team will contact you to schedule the visit. The service addresses issues like minor alignment, loose parts etc. It also covers general alignment check of all shutters, lofts, the functioning of drawers and all accessories, and any additional concealed wiring needs for the TV console.</li>
                <li style={{ marginBottom: '8px' }}>Since by design, the products have a lot of moving parts, our product may need occasional re-alignments and servicing. Should there be any service and maintenance calls after the free service, they will be done on a chargeable basis. IP Home Furnishings Pvt Ltd (Interior Plus)'s current service visit fee is a sum of Rs. 750 (Rupees Seven Hundred and Fifty) per visit. This visit includes re-alignment of all products, but without any replacements.</li>
                <li style={{ marginBottom: '8px' }}>During this visit, if an item is found to be faulty, the same will be replaced based on the below scenarios:</li>
              </ul>
              <div style={{ backgroundColor: '#1A1A1A', padding: '20px', borderRadius: '12px', border: '1px solid rgba(197, 156, 130, 0.1)', marginLeft: '24px' }}>
                <p style={{ marginBottom: '12px' }}>• If work involved is only replacement of items covered under warranty, and no other realignment/replacement, the sum of Rs 750 will be waived off.</p>
                <p>• If the work includes re-alignment of units and/or replacement of items not covered under warranty (due to physical damage, continuous water leakage, rusting, etc), the cost of replacement will be over and above Rs 750, and a bill for the same will be shared after the visit.</p>
              </div>
            </section>

            {/* Cleaning Services */}
            <section style={{ marginBottom: '32px' }}>
              <h2 className="font-heading" style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#E5E5E5', marginBottom: '16px', textTransform: 'uppercase' }}>
                Cleaning Services
              </h2>
              <p style={{ marginBottom: '16px' }}>Post installation, the following set of services will be done at the site:</p>
              <ul style={{ listStyle: 'disc', paddingLeft: '24px', marginBottom: '16px' }}>
                <li style={{ marginBottom: '8px' }}>Dusting, sweeping and mopping of all areas</li>
                <li style={{ marginBottom: '8px' }}>Cleaning of doors of the cabinets to remove pencil mark and dust</li>
                <li style={{ marginBottom: '8px' }}>Cleaning the insides of wooden cabinets</li>
              </ul>
            </section>

            {/* Unloading Services */}
            <section style={{ marginBottom: '32px' }}>
              <h2 className="font-heading" style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#E5E5E5', marginBottom: '16px', textTransform: 'uppercase' }}>
                Unloading Services
              </h2>
              <p style={{ marginBottom: '16px' }}>Any movement of materials by stairs above 2nd floor will attract the following additional charges:</p>
              <ul style={{ listStyle: 'disc', paddingLeft: '24px', marginBottom: '16px' }}>
                <li style={{ marginBottom: '8px' }}>An unloading charge of Rs 5000 shall be charged from 3rd floor or above where the service lift is unavailable.</li>
                <li style={{ marginBottom: '8px' }}>Additional Rs 1000 per floor shall be charged for each floor from 9th floor onwards, in case the site is above the 8th floor.</li>
              </ul>
            </section>

            {/* Delivery Guarantee Categories */}
            <section style={{ marginBottom: '32px' }}>
              <h2 className="font-heading" style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#E5E5E5', marginBottom: '16px', textTransform: 'uppercase' }}>
                Delivery Guarantee Categories
              </h2>
              <div style={{ backgroundColor: '#1A1A1A', borderRadius: '12px', border: '1px solid rgba(197, 156, 130, 0.1)', overflow: 'hidden', marginBottom: '24px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: 'rgba(197, 156, 130, 0.1)' }}>
                      <th style={{ padding: '16px', textAlign: 'left', color: '#C59C82', fontWeight: '600', borderBottom: '1px solid rgba(197, 156, 130, 0.2)' }}>Type</th>
                      <th style={{ padding: '16px', textAlign: 'left', color: '#C59C82', fontWeight: '600', borderBottom: '1px solid rgba(197, 156, 130, 0.2)' }}>Categories</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ padding: '16px', borderBottom: '1px solid rgba(197, 156, 130, 0.1)', color: '#E5E5E5', verticalAlign: 'top' }}>Standard IP Home Furnishings Pvt Ltd (Interior Plus) Offerings</td>
                      <td style={{ padding: '16px', borderBottom: '1px solid rgba(197, 156, 130, 0.1)' }}>
                        Modular / Fit-out Furniture (incl. installation), False Ceiling, Standard Electrical Works (creation of new points, shifting of existing points), Countertop services (granite removal, chipping and installation), Appliances (incl. installation), Lighting (incl. installation), Cleaning Services, Non Standard Electrical Works
                      </td>
                    </tr>
                    <tr>
                      <td style={{ padding: '16px', borderBottom: '1px solid rgba(197, 156, 130, 0.1)', color: '#E5E5E5', verticalAlign: 'top' }}>Additional Services</td>
                      <td style={{ padding: '16px', borderBottom: '1px solid rgba(197, 156, 130, 0.1)' }}>
                        Wallpaper (incl. Installation), Wooden Flooring, Texture Painting (incl. final coat of paint), Painting: Phase 2 (typically final coat of paint), Non-Texture Painting, Curtains
                      </td>
                    </tr>
                    <tr>
                      <td style={{ padding: '16px', color: '#E5E5E5', verticalAlign: 'top' }}>Non-Standard Categories</td>
                      <td style={{ padding: '16px' }}>
                        Loose Furniture, Mattress, Wall Art, Home Automation, Civil / Renovation Works
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <ul style={{ listStyle: 'disc', paddingLeft: '24px' }}>
                <li style={{ marginBottom: '8px' }}>The Delivery Guarantee period will begin once you & your IP Home Furnishings Pvt Ltd (Interior Plus) project team sign off on your design, you have accepted the IP Home Furnishings Pvt Ltd (Interior Plus) Works Contract and your payment of second installment (60% of quote value) is received.</li>
                <li style={{ marginBottom: '8px' }}>If we don't complete your project within the said delivery period then we will pay you rent (Rs. 500/day) for every day of delay subject to the fulfilment of all the Pre-Conditions for availing such a delivery guarantee.</li>
                <li style={{ marginBottom: '8px' }}>Preconditions to our Delivery Guarantee: All items contained in the site-readiness checklist should be complete when we begin the installation process.</li>
                <li style={{ marginBottom: '8px' }}>If an item is not marked with any category symbol then it shall be assumed that it belongs to the Standard IP Home Furnishings Pvt Ltd (Interior Plus) Offerings category wherein 45 days delivery guarantee will be applicable.</li>
              </ul>
            </section>

            {/* Cancellation Policy */}
            <section style={{ marginBottom: '32px' }}>
              <h2 className="font-heading" style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#E5E5E5', marginBottom: '16px', textTransform: 'uppercase' }}>
                Cancellation Policy
              </h2>
              <p style={{ marginBottom: '24px' }}>
                At IP Home Furnishings Pvt Ltd (Interior Plus), we wish to see every order succeed. However, since we too depend on other stakeholders (such as manufacturers, raw material providers, accessory suppliers), there are times when we need to make changes to our prices and material offerings. In such situations, we owe it to our customers to be fair and transparent, also allowing them to cancel their order if the situation demands.
              </p>

              <div style={{ backgroundColor: '#1A1A1A', borderRadius: '12px', border: '1px solid rgba(197, 156, 130, 0.1)', overflow: 'hidden', marginBottom: '24px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: 'rgba(197, 156, 130, 0.1)' }}>
                      <th style={{ padding: '16px', textAlign: 'left', color: '#C59C82', fontWeight: '600', borderBottom: '1px solid rgba(197, 156, 130, 0.2)' }}>Stage of Order</th>
                      <th style={{ padding: '16px', textAlign: 'left', color: '#C59C82', fontWeight: '600', borderBottom: '1px solid rgba(197, 156, 130, 0.2)' }}>Eligibility</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ padding: '16px', borderBottom: '1px solid rgba(197, 156, 130, 0.1)', color: '#E5E5E5', verticalAlign: 'top' }}>Design Stage</td>
                      <td style={{ padding: '16px', borderBottom: '1px solid rgba(197, 156, 130, 0.1)' }}>
                        <p style={{ marginBottom: '8px' }}>• Within 48 hours from order booking or site measurement visit (whichever is earlier) - <span style={{ color: '#4ade80' }}>Eligible for cancellation</span></p>
                        <p>• After 48 hours from order booking or site measurement visit - <span style={{ color: '#C59C82' }}>Subject to conditions (see notes below)</span></p>
                      </td>
                    </tr>
                    <tr>
                      <td style={{ padding: '16px', borderBottom: '1px solid rgba(197, 156, 130, 0.1)', color: '#E5E5E5', verticalAlign: 'top' }}>Production Stage</td>
                      <td style={{ padding: '16px', borderBottom: '1px solid rgba(197, 156, 130, 0.1)' }}>
                        <span style={{ color: '#ef4444' }}>Not eligible for cancellation</span>
                      </td>
                    </tr>
                    <tr>
                      <td style={{ padding: '16px', color: '#E5E5E5', verticalAlign: 'top' }}>Post-Production Stage</td>
                      <td style={{ padding: '16px' }}>
                        <span style={{ color: '#ef4444' }}>Not eligible for cancellation</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div style={{ backgroundColor: '#1A1A1A', padding: '24px', borderRadius: '12px', border: '1px solid rgba(197, 156, 130, 0.2)' }}>
                <h4 style={{ color: '#C59C82', marginBottom: '16px', fontWeight: '600' }}>Important Notes:</h4>
                <ol style={{ listStyle: 'lower-alpha', paddingLeft: '24px' }}>
                  <li style={{ marginBottom: '12px' }}>Time period is computed from the date of order book (Rs.50,000 or 10% payment received by IP Home Furnishings Pvt Ltd (Interior Plus)).</li>
                  <li style={{ marginBottom: '12px' }}><strong style={{ color: '#E5E5E5' }}>Design Stage:</strong> Stage after order book payment has been made and before the (Order book + 60%) payment is made and designs are accepted by the IP Home Furnishings Pvt Ltd (Interior Plus) production team.</li>
                  <li style={{ marginBottom: '12px' }}><strong style={{ color: '#E5E5E5' }}>Production Stage:</strong> Stage after 60% payment has been made and before the 100% payment is made.</li>
                  <li style={{ marginBottom: '12px' }}>No cash amount shall be refunded in such cases. However, IP Home Furnishings Pvt Ltd (Interior Plus) products can be purchased by the customer to the extent of 50% of the advance amount paid, within 12 months of order booking. Balance 50% shall be deducted as design and marketing costs.</li>
                  <li style={{ marginBottom: '12px' }}>A project cannot be cancelled once the designs are finalized and the project is under production. The customer shall not receive any refund if the project is cancelled and further the customer shall be obligated to pay the remaining order value of the project to the Company.</li>
                  <li style={{ marginBottom: '12px' }}>Please reach out to our Sales Manager or Designer for further details.</li>
                  <li style={{ marginBottom: '0' }}>All payments shall be made via cheque/demand draft/bank transfer (NEFT/RTGS/IMPS)/UPI only.</li>
                </ol>
              </div>
            </section>

            {/* Refund Policy */}
            <section style={{ marginBottom: '32px' }}>
              <h2 className="font-heading" style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#E5E5E5', marginBottom: '16px', textTransform: 'uppercase' }}>
                Refund Policy
              </h2>
              <div style={{ backgroundColor: '#1A1A1A', padding: '24px', borderRadius: '12px', border: '1px solid rgba(197, 156, 130, 0.2)' }}>
                <p style={{ marginBottom: '16px' }}>
                  The booking amount paid as the 1st milestone is <strong style={{ color: '#C59C82' }}>non-refundable</strong>. This amount is utilized towards:
                </p>
                <ul style={{ listStyle: 'disc', paddingLeft: '24px', marginBottom: '16px' }}>
                  <li style={{ marginBottom: '8px' }}>Site measurement and survey</li>
                  <li style={{ marginBottom: '8px' }}>Design development and 3D visualization</li>
                  <li style={{ marginBottom: '8px' }}>Material selection and planning</li>
                  <li style={{ marginBottom: '8px' }}>Project coordination and management</li>
                </ul>
                <p>
                  Once the 2nd milestone payment is made and production has begun, cancellations will be subject to deductions based on the stage of production and materials procured. Please refer to the Cancellation Policy above for detailed eligibility criteria.
                </p>
              </div>
            </section>

            {/* Contact */}
            <section>
              <h2 className="font-heading" style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#E5E5E5', marginBottom: '16px', textTransform: 'uppercase' }}>
                Contact Us
              </h2>
              <p style={{ marginBottom: '16px' }}>
                If you have any questions about these terms and conditions, please contact us at:
              </p>
              <div style={{ backgroundColor: '#1A1A1A', padding: '24px', borderRadius: '12px', border: '1px solid rgba(197, 156, 130, 0.1)' }}>
                <p style={{ marginBottom: '8px' }}><strong style={{ color: '#E5E5E5' }}>Email:</strong> info@interiorplus.in</p>
                <p style={{ marginBottom: '8px' }}><strong style={{ color: '#E5E5E5' }}>Website:</strong> <a href="https://interiorplus.in/contact-us" style={{ color: '#C59C82', textDecoration: 'underline' }}>https://interiorplus.in/contact-us</a></p>
                <p><strong style={{ color: '#E5E5E5' }}>Address:</strong> Bengaluru, Karnataka, India</p>
              </div>
            </section>
          </div>
        </div>
      </main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
};

export default TermsAndConditions;
