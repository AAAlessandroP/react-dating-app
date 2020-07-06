import React, { Component, useState } from "react";
import { render } from "react-dom";
import { Frame, Stack, useCycle, Color, FrameProps } from "framer";
import $ from "jquery";
import { BrowserRouter as Router, Route, Switch } from "react-router-dom";
import './App.css';
import Grid from '@material-ui/core/Grid';

import Button from '@material-ui/core/Button';
import CssBaseline from '@material-ui/core/CssBaseline';
import TextField from '@material-ui/core/TextField';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';
import Link from '@material-ui/core/Link';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';
import Container from '@material-ui/core/Container';

class Menu extends Component {

  constructor() {
    super();
    this.state = { me: {} };
  }

  async componentDidMount() {//chiamato prima di render
    this.setState({ me: await $.get("http://localhost:3000/api/me") });
  }
  render() {
    const variants = {
      variantA: { scale: 0.01 },
      variantB: { scale: 1.0 },
    }
    return (
      <div className="menu">
        {JSON.stringify(this.state.me)}
        <button>
          <a href="/settings">Impostazioni</a>
        </button>
        <button>
          {this.state.me.Utente ?
            <Frame>ME
            <Frame
                initial={"variantA"}
                whileHover={"variantB"}
                variants={variants}
              >
                <a href={"/users/" + this.state.me.IDUtente}>Il Mio Profilo</a>
              </Frame>
            </Frame>
            : <a href="/login">login</a>}
        </button>
      </div>
    )
  }
}

const AnteprimaUtente = (props) => {


  const [mostraInfo, setMostraInfo] = React.useState(false)
  const mostraPiuInfo = () => setMostraInfo(true)
  const [animaz_1, cycle] = useCycle(
    { backgroundColor: Color("#FFF"), scale: 1.0, rotate: 360 },
    //ogni batteria di animazioni deve ripetere ogni volta tutte le props
    // posso dire che backgroundColor cambia ma non che background cambi 
    { backgroundColor: Color("#0055FF"), scale: 0.0, rotate: -180 }
  );

  return (
    <Frame
      onHoverStart={mostraPiuInfo}
      whileHover={{ scale: 1.2 }}
      onClick={mostraPiuInfo}
      onTap={mostraPiuInfo}
      onHoverEnd={() => setMostraInfo(false)}
      initial={{
        rotate: Math.random() * 100
      }} animate={{ rotate: 0 }} transition={{ duration: 0.5 }} size="30%" background={"#fff"} radius={4} >{/*mettere size:30 impica che quel frame occupa 1/3 di schermo -> ne stano 3 in tutto*/}

      {!mostraInfo ? <p>{props.name}</p> : null}
      <img style={{ maxWidth: "70%", maxHeight: "70%" }} src={props.src} onClick={() => console.log(123)}></img>{/*dimensioni immagine rispetto al user-box*/}

      {mostraInfo ? <div className="info">
        <h3><a href={"/users/" + props.id}>vedi {props.name}</a></h3>
        <article>
          {props.info}
        </article>
      </div> : null}
    </Frame >
  );
}

class App extends Component {

  render() {
    return (
      <Router>
        <main>
          <Switch>
            <Route path="/" exact component={Home} />
            <Route path="/settings" exact component={Settings} />
            <Route path="/login" exact component={Login} />
            <Route path="/register" exact component={Register} />
            <Route path="/error" exact render={() => <><Menu /><h1>Ops...</h1></>} />
            <Route path="/error/:descr" exact render={props => <><Menu /><h1>Ops... Error "{props.match.params.descr}"</h1></>} />
            <Route path="/users/:id" component={PaginaUtente} />
          </Switch>
        </main>
      </Router>
    );
  }

}
export default App;

class Home extends Component {

  constructor() {
    super();
    this.state = { users: [], me: {} };
  }

  async componentDidMount() {//chiamato prima di render
    this.setState({ users: await $.get('http://localhost:3000/api/users') });
  }

  render() {
    return (
      <div className="App" >
        <Menu />
        <Stack size="90%" direction={"horizontal"}>

          {this.state.users.map((ele, index) => <AnteprimaUtente name={ele.Name} id={ele._id} src={ele.picUrl} info={ele.info} key={index} index={index} />
          )}
        </Stack>
      </div >
    )
  }
}

class PaginaUtente extends Component {
  constructor() {
    super()
    this.state = { user: {} };
  }

  async componentDidMount() {//chiamato prima di render
    let user = await $.get('http://localhost:3000/api/users/' + this.props.match.params.id);
    this.setState({ user });
  }

  render() {
    return (
      <div>
        <h1>Pagina di {this.state.user.name}:</h1>
        <img style={{ maxWidth: "50%", maxHeight: "50%" }} src={this.state.user.picUrl} onClick={() => console.log(123)}></img>
        <div className="info" >
          <h3>{this.state.user.name}</h3>
          <article>
            {this.state.user.info}
          </article>
        </div >
      </div>
    )
  }
}


const Settings = props => (
  // props.match.params.name
  <>Settings</>
);


function Copyright() {
  return (
    <Typography variant="body2" color="textSecondary" align="center">
      {'Free from any Copyright © '}
      <Link color="inherit" href="https://material-ui.com/">
        by A.P
      </Link>{' '}
      {new Date().getFullYear()}
      {'.'}
    </Typography>
  );
}

const useStyles = makeStyles((theme) => ({
  paper: {
    marginTop: theme.spacing(8),
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  form: {
    width: '100%', // Fix IE 11 issue.
    marginTop: theme.spacing(1),
  },
  submit: {
    margin: theme.spacing(3, 0, 2),
  },
}));

function Login() {

  const classes = useStyles();
  function submit(e) {
    e.preventDefault();
    $.post("http://localhost:3000/api/login", $("form").serialize()).always((data, status) => {
      if (status == "error")
        alert("error")
      else
        window.location = "/"
    })
  }
  return (
    <Container component="main" maxWidth="xs">
      <CssBaseline />
      <div className={classes.paper}>
        <Typography component="h1" variant="h5">
          Sign in
        </Typography>
        <form className={classes.form} onSubmit={submit} noValidate>
          <TextField
            variant="outlined"
            margin="normal" required fullWidth id="name" label="Name" name="utente" autoComplete="email"
            autoFocus
          />
          <TextField variant="outlined" margin="normal" required fullWidth name="passw" label="Password"
            type="password"
            id="password"
            autoComplete="current-password"
          />
          <FormControlLabel
            control={<Checkbox value="remember" color="primary" />}
            label="Remember me"
          />
          <Button type="submit" fullWidth variant="contained" color="primary" className={classes.submit}>
            Sign In
          </Button>
          <Grid container>
            <Grid item>
              <Link href="#" variant="body2">
                {"Don't have an account? Sign Up"}
              </Link>
            </Grid>
          </Grid>
        </form>
      </div>
      <Copyright />
    </Container>
  );
}

function Register() {
  const classes = useStyles();

  function submit(e) {
    e.preventDefault();
    $.post("http://localhost:3000/api/addUser", $("form").serialize()).always((data, status) => {
      if (data.status == 409) {
        alert("username already taken")
      } else {
        if (status == "error")
          alert("error")
        else
          window.location = "/"
      }
    })
  }

  return (
    <Container component="main" maxWidth="xs">
      <CssBaseline />
      <div className={classes.paper}>
        <Typography component="h1" variant="h5">
          Register
        </Typography>
        <form className={classes.form} onSubmit={submit} noValidate>
          <TextField
            required
            variant="outlined"
            margin="normal" required fullWidth id="name" label="Name displayed" name="name" autoComplete="name"
            autoFocus
          />
          <TextField variant="outlined" margin="normal" required fullWidth name="passw" label="Password"
            type="password"
            required
            id="password"
            autoComplete="current-password"
          />
          <FormControlLabel
            control={<Checkbox value="remember" color="primary" />}
            label="Remember me"
          />
          <Button type="submit" fullWidth variant="contained" color="primary" className={classes.submit}>
            Register
          </Button>
          <Grid container>
            <Grid item>
              <Link href="/login" variant="body2">
                {"already have an account? Sign In"}
              </Link>
            </Grid>
          </Grid>
        </form>
      </div>
      <Copyright />
    </Container>
  );
}