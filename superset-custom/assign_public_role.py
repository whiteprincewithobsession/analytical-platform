from superset import create_app
app = create_app()
with app.app_context():
    from superset.extensions import db
    from superset.models.dashboard import Dashboard
    from flask_appbuilder.security.sqla.models import Role
    
    dashboard = db.session.query(Dashboard).filter_by(id=2).first()
    public_role = db.session.query(Role).filter_by(name="Public").first()
    gamma_role = db.session.query(Role).filter_by(name="Gamma").first()
    admin_role = db.session.query(Role).filter_by(name="Admin").first()
    
    print(f"Dashboard found: {dashboard is not None}")
    if dashboard:
        print(f"Dashboard title: {dashboard.dashboard_title}")
        print(f"Dashboard roles: {[r.name for r in dashboard.roles]}")
    print(f"Public role: {public_role}")
    print(f"Gamma role: {gamma_role}")
    print(f"Admin role: {admin_role}")
    
    all_roles = db.session.query(Role).all()
    print(f"All roles: {[r.name for r in all_roles]}")
    
    if dashboard and public_role:
        if public_role not in dashboard.roles:
            dashboard.roles.append(public_role)
            db.session.commit()
            print("\nPublic role assigned to dashboard!")
        else:
            print("\nPublic role already assigned")
    elif dashboard and gamma_role:
        if gamma_role not in dashboard.roles:
            dashboard.roles.append(gamma_role)
            db.session.commit()
            print("\nGamma role assigned to dashboard!")
        else:
            print("\nGamma role already assigned")
