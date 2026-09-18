import React from 'react';
import { Link } from 'react-router-dom';

const EQUIPMENT_CATEGORIES = [
  '🚧 Excavators',
  '🚜 Bulldozers',
  '🏗️ Cranes',
  '🔧 Concrete Mixers',
  '🪜 Scaffolding',
  '🚛 Dump Trucks',
  '🔩 Forklifts',
  '⚙️ Compactors',
  '🔨 Jackhammers',
  '💡 Generators',
];

function Home() {
  return (
    <div className="home">
      <section className="hero">
        <div className="hero-content">
          <h1>Find Equipment to Rent and Buy</h1>
          <p>Browse construction equipment available near you:</p>
          <ul className="equipment-categories">
            {EQUIPMENT_CATEGORIES.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <Link to="/equipment" className="btn btn-primary">Browse Equipment</Link>
        </div>
      </section>
    </div>
  );
}

export default Home;
