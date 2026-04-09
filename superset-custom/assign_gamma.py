from superset import create_app
app = create_app()
with app.app_context():
    from superset.extensions import db
    from superset.models.dashboard import Dashboard
    from flask_appbuilder.security.sqla.models import Role
    
    dashboard = db.session.query(Dashboard).filter_by(id=2).first()
    gamma_role = db.session.query(Role).filter_by(name="Gamma").first()
    public_role = db.session.query(Role).filter_by(name="Public").first()
    
    if dashboard and gamma_role:
        if gamma_role not in dashboard.roles:
            dashboard.roles.append(gamma_role)
        db.session.commit()
        print("Gamma role assigned to dashboard!")
    if dashboard and public_role:
        if public_role not in dashboard.roles:
            dashboard.roles.append(public_role)
        db.session.commit()
        print("Public role assigned to dashboard!")
    print(f"Dashboard roles: {[r.name for r in dashboard.roles]}")
