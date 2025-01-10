import { Component, OnInit } from '@angular/core';
import coins from './coins.json';
import { ExchangeService } from '../../services/exchange.service';
import { AuthService } from '../../services/auth.service';
import { ChartService } from '../../services/chart.service';
import { Router } from '@angular/router';

interface Currency {
  name: string;
  shortname: string;
  symbol: string;
}

@Component({
  selector: 'app-conversor',
  templateUrl: './conversor.component.html',
  styleUrls: ['./conversor.component.css'],
})
export class ConversorComponent implements OnInit {
  amount: number = 0;
  convertedAmount: number = 0;
  fromCurrency: Currency = { name: 'United States Dollar', shortname: 'USD', symbol: '$' };
  toCurrency: Currency = { name: 'Euro', shortname: 'EUR', symbol: '€' };
  currencies: Currency[] = coins;
  dropdownOpenFrom: boolean = false;
  dropdownOpenTo: boolean = false;
  filteredCurrencies: Currency[] = [];
  email: string = '';
  historyData: any[] = [];
  lineChartData: any = { datasets: [], labels: [] };

  constructor(
    private exchangeService: ExchangeService,
    private authService: AuthService,
    private chartService: ChartService,
    private router: Router,
  ) {}

  ngOnInit() {
    this.filteredCurrencies = this.currencies;
    this.email = this.authService.getUserEmail();

    // Cargar historial del usuario al iniciar
    this.authService.viewHistory(this.email).subscribe(
      (data) => this.historyData = data,
      (error) => console.error("Error al obtener el historial:", error)
    );
  }

  swapCurrencies() {
    // Intercambia las monedas seleccionadas
    [this.fromCurrency, this.toCurrency] = [this.toCurrency, this.fromCurrency];
  }

  async getExchangeRate() {
    try {
      const data = await this.exchangeService.getExchangeRate(
        this.fromCurrency.shortname, this.toCurrency.shortname, this.amount
      ).toPromise();
      
      this.convertedAmount = data.conversion_result;
      this.updateChartData();
      await this.createExchangeHistory(this.fromCurrency.shortname, data.conversion_result);
      this.updateHistory();
    } catch (error) {
      console.error('Error al obtener la tasa de cambio o crear el historial', error);
    }
  }

  async createExchangeHistory(fromCoin: string, conversionResult: number) {
    try {
      await this.exchangeService.createExchangeHistory(
        fromCoin, this.amount, this.toCurrency.shortname, conversionResult, new Date(), this.email
      ).toPromise();
    } catch (error) {
      console.error('Error al crear el historial', error);
    }
  }

  toggleDropdown(select: 'from' | 'to') {
    // Alterna el estado del dropdown seleccionado
    if (select === 'from') {
      this.dropdownOpenFrom = !this.dropdownOpenFrom;
      this.dropdownOpenTo = false;
    } else {
      this.dropdownOpenTo = !this.dropdownOpenTo;
      this.dropdownOpenFrom = false;
    }
  }

  selectCurrency(currency: Currency, type: 'from' | 'to') {
    // Establece la moneda seleccionada
    if (type === 'from') {
      this.fromCurrency = currency;
    } else {
      this.toCurrency = currency;
    }
    this.closeDropdowns();
  }

  closeDropdowns() {
    this.dropdownOpenFrom = false;
    this.dropdownOpenTo = false;
  }

  filterCurrencies(event: Event) {
    // Filtra las monedas según el texto ingresado
    const searchTerm = (event.target as HTMLInputElement).value.toLowerCase();
    this.filteredCurrencies = this.currencies.filter(
      (currency) =>
        currency.shortname.toLowerCase().includes(searchTerm) ||
        currency.symbol.toLowerCase().includes(searchTerm) ||
        currency.name.toLowerCase().includes(searchTerm)
    );
  }

  updateHistory() {
    this.authService.viewHistory(this.email).subscribe(
      (data) => this.historyData = data,
      (error) => console.error("Error al obtener el historial:", error)
    );
  }

  chartReady: boolean = false;

  updateChartData() {
    this.chartService.getHistoricalData(this.fromCurrency.shortname, this.toCurrency.shortname).subscribe(
      (data) => {
        const timeSeries = data['Time Series FX (Daily)'];
        if (!timeSeries) return;

        const labels = Object.keys(timeSeries).reverse();
        const values = labels.map(date => parseFloat(timeSeries[date]?.['4. close']) || 0);

        this.lineChartData = {
          labels,
          datasets: [{
            data: values,
            label: `${this.fromCurrency.shortname} to ${this.toCurrency.shortname}`,
            borderColor: '#3e95cd',
            fill: false,
          }],
        };
        this.chartReady = true;
      },
      (error) => {
        console.error('Error fetching chart data', error);
        this.chartReady = false;
      }
    );
  }

  onAmountChange() {
    // Puedes manejar cambios en el monto aquí si es necesario
  }
}
